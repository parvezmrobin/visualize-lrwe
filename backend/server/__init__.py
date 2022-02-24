import json
import os
from typing import Dict, List

import numpy as np
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS
from sklearn.decomposition import PCA
from sklearn.metrics.pairwise import cosine_similarity

from server.utils import get_embedding_index, checkout_to, \
  get_java_files_from, get_embeddings, get_embedding_of_file, FileEmbeddings, \
  chop_dict, first_value_of, first_key_of

os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
assert os.getcwd().endswith('backend')

app = Flask(__name__)
CORS(app)

TOMCAT_REPO_DIR = './dataset/lr+we/repo/tomcat'
TOMCAT_DATA_FILE = './dataset/lr+we/dataset/Tomcat.xlsx'

dataframes: Dict[str, pd.DataFrame] = {}
tomcat_df = pd.read_excel(TOMCAT_DATA_FILE, 0)
dataframes['tomcat'] = tomcat_df

embedding_index = get_embedding_index()
print('Loaded embedding.')

pca = PCA(n_components=2)
pca.fit(np.stack(list(embedding_index.values()), axis=0))
print('Initiated PCA.')

file_embeddings: FileEmbeddings
file_tokens_of: Dict[str, List[str]]
file_map = get_java_files_from(TOMCAT_REPO_DIR, no_prefix=True)
file_embeddings, file_tokens_of = get_embeddings(
  file_map, embedding_index, return_tokens=True,
)

print('Bootstrapped.')


@app.route('/bug', methods=['GET'])
def get_bug_ids():
  summary = tomcat_df[['bug_id', 'summary']].to_dict()
  return jsonify(summary)


@app.route('/bug/<bug_id>/similarities')
def get_word_similarities(bug_id):
  global file_embeddings, file_tokens_of

  # gather necessary data
  bug_row = tomcat_df[tomcat_df.bug_id == int(bug_id)].iloc[0]
  commit = bug_row.commit
  bug_report = bug_row.summary
  if isinstance(bug_row.description, str):
    bug_report += ('\n' + bug_row.description)

  # TODO: update file cache
  checkout_to(commit, TOMCAT_REPO_DIR)

  # generate tokens and embeddings
  bug_report_embedding: np.ndarray
  bug_report_tokens: List[str]
  bug_report_embedding, bug_report_tokens = get_embedding_of_file(
    bug_report, embedding_index, return_tokens=True,
  )

  # compute similarities

  # if bug_report has n tokens, then `bug_report_embedding.shape == (n, 300)`
  # if x.java has m tokens, then `file_embeddings['x.java'].shape == (m, 300)`
  # Then, `word_to_word_similarities['x.java'].shape == (n, m)`
  word_to_word_similarities: Dict[str, np.ndarray] = {
    filename: cosine_similarity(bug_report_embedding, file_embedding)
    for filename, file_embedding in file_embeddings.items()
  }

  # 0th axis is bug-report axis. Therefore, reducing over axis 1 will give
  # maximum similarity for each bug word
  bug_word_to_file_similarities: Dict[str, np.ndarray] = {
    filename: np.max(word_to_word_similarity, axis=1)
    for filename, word_to_word_similarity in word_to_word_similarities.items()
  }
  assert first_value_of(bug_word_to_file_similarities).shape == (
    len(bug_report_tokens),
  )

  # 1st axis is bug-report axis. Therefore, reducing over axis 0 will give
  # maximum similarity for each file word
  file_word_to_bug_similarities: Dict[str, np.ndarray] = {
    filename: np.max(word_to_word_similarity, axis=0)
    for filename, word_to_word_similarity in word_to_word_similarities.items()
  }
  _k = first_key_of(file_word_to_bug_similarities)
  assert file_word_to_bug_similarities[_k].shape == (
    file_embeddings[_k].shape[0],
  )

  # ignoring words that had a zero similarity with the target document,
  # i.e. words that either do not have a word embedding, or that do not
  # appear in the target document.
  known_bug_report_tokens = set(token for token in bug_report_tokens
                                if token in embedding_index.keys())
  common_words_count_of: Dict[str, float] = {}
  for filename, file_tokens in file_tokens_of.items():
    common_words = tuple(token for token in known_bug_report_tokens
                         if token in file_tokens)
    common_words_count_of[filename] = len(common_words) + 1

  bug_to_file_similarity: Dict[str, np.ndarray] = {
    fn: (np.sum(bug_word_to_file_sim) / common_words_count_of[fn])
    for fn, bug_word_to_file_sim in bug_word_to_file_similarities.items()
  }

  # List of common words will be the same. Use the following
  # Ven Diagram as proof.
  #                        ┏━━━━━━━━━━━━┓
  #                        ┃            ┃←───── embedding_index.keys()
  #                    ┌───┃────▅▅▅▅════┃═══╗
  #                    │   ┃    ████    │   ║
  # bug_report_tokens →│   ┗━━━━▀▀▀▀━━━━┛   ║← file_tokens
  #                    │        ║  │        ║
  #                    └────────╚══╧════════╝
  # The blocked part is common words
  file_to_bug_similarity: Dict[str, np.ndarray] = {
    fn: (np.sum(file_word_to_bug_sim) / common_words_count_of[fn])
    for fn, file_word_to_bug_sim in file_word_to_bug_similarities.items()
  }

  asymmetric_similarity: Dict[str, np.ndarray] = {
    fn: bug_to_file_similarity[fn] + file_to_bug_similarity[fn]
    for fn in bug_to_file_similarity.keys()
  }

  top_files = list(sorted(
    asymmetric_similarity.keys(),
    key=lambda fn: asymmetric_similarity[fn],
    reverse=True,
  ))[:100]

  bug_locations = list(sorted(
    asymmetric_similarity.items(),
    key=lambda sim: sim[1],  # sort using value
    reverse=True,
  ))[:10]

  top_word_i_of: Dict[str, List[int]] = {}
  for filename in top_files:
    file_tokens = file_tokens_of[filename]
    file_word_to_bug_sim = file_word_to_bug_similarities[filename]
    unq_tokens, token_idx = np.unique(file_tokens, return_index=True)
    unq_similarities = np.zeros(file_word_to_bug_sim.shape)
    # only assign values at unique indices
    unq_similarities[token_idx] = file_word_to_bug_sim[token_idx]
    # using minus sign so that `argsort` work in reverse order
    top_word_i_of[filename] = np.argsort(-unq_similarities)[:100]

  # reduce dimensionality
  bug_report_embedding_2d = pca.transform(bug_report_embedding)
  file_embedding_2d = {
    filename: pca.transform(file_embeddings[filename])
    for filename in top_files
  }

  # select data for response
  resp_file_tokens = {
    filename: [file_tokens_of[filename][i] for i in top_word_i_of[filename]]
    for filename in top_files
  }
  resp_file_embeddings = {
    filename: file_embedding_2d[filename]
    for filename in top_files
  }

  resp_word_to_word_similarities = {
    filename: (word_to_word_similarities[filename][:, top_word_i_of[filename]])
    for filename in top_files
  }

  resp_file_word_to_bug_similarity = {
    filename: (file_word_to_bug_similarities[filename][top_word_i_of[filename]])
    for filename in top_files
  }

  response = json.dumps({
    'fileTokens': resp_file_tokens,
    'fileEmbedding': resp_file_embeddings,
    'bugReportTokens': bug_report_tokens,
    'bugReportEmbedding': bug_report_embedding_2d,
    'wordToWordSimilarities': resp_word_to_word_similarities,
    'fileWordToBugSimilarity': resp_file_word_to_bug_similarity,
    'bugWordToFileSimilarities': chop_dict(
      bug_word_to_file_similarities, top_files),
    'bugReportToFileSimilarity': chop_dict(bug_to_file_similarity, top_files),
    'fileToBugReportSimilarity': chop_dict(file_to_bug_similarity, top_files),
    'asymmetricSimilarity': chop_dict(asymmetric_similarity, top_files),
    'bugLocations': bug_locations,
  }, default=_default_json_serializer)

  print('Response size:', len(response))
  return response


def _default_json_serializer(o):
  return o.round(6).tolist() if isinstance(o, np.ndarray) else o
