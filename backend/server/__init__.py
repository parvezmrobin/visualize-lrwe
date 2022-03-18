import gc
import json
import os
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.metrics.pairwise import cosine_similarity

from server.utils import get_embedding_index, checkout_to, \
  get_java_files_from, get_embeddings, get_embedding_of_file, FileEmbeddings, \
  chop_dict, first_value_of, first_key_of, EMBEDDING_DIMENSION

os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
assert os.getcwd().endswith('backend')

app = Flask(__name__)
CORS(app)

TOMCAT_REPO_DIR = './dataset/lr+we/repo/tomcat'
TOMCAT_DATA_FILE = './dataset/lr+we/dataset/Tomcat.xlsx'

dataframes: Dict[str, pd.DataFrame] = {}
tomcat_df = pd.read_excel(TOMCAT_DATA_FILE, 0)
dataframes['tomcat'] = tomcat_df

embedding_index = get_embedding_index(directory='dataset')
print('Loaded embedding.')

pca = PCA(n_components=2)
pca.fit(np.stack(list(embedding_index.values()), axis=0))
t_sne = TSNE(
  n_components=2, learning_rate='auto', init='random', random_state=420,
)
print('Initiated PCA & tSNE.')

file_embeddings: FileEmbeddings
file_tokens_of: Dict[str, List[str]]
file_map = get_java_files_from(
  TOMCAT_REPO_DIR, no_prefix=True, ignore_test_files=True,
)
file_embeddings, file_tokens_of = get_embeddings(
  file_map, embedding_index, return_tokens=True,
)

print('Bootstrapped.')


@app.route('/bug', methods=['GET'])
def get_bug_ids():
  summary = tomcat_df[['bug_id', 'summary']].to_dict()
  return jsonify(summary)


@app.route('/bug/<bug_id>/tsne', methods=['POST'])
def get_tsne_dimensions(bug_id):
  bug_row = tomcat_df[tomcat_df.bug_id == int(bug_id)].iloc[0]
  bug_report = bug_row.summary
  if isinstance(bug_row.description, str):
    bug_report += ('\n' + bug_row.description)

  bug_report_embedding = get_embedding_of_file(bug_report, embedding_index)

  filenames = request.json['filenames']
  top_word_indices = request.json['topWordIndices']

  segments: List[np.ndarray] = [bug_report_embedding]
  segment_indices: Dict[str, Tuple[int, int]] = {}

  curr_ending_idx = len(bug_report_embedding)
  for filename in filenames:
    top_word_index = top_word_indices[filename]
    file_embedding = file_embeddings[filename][top_word_index]
    segments.append(file_embedding)
    segment_indices[filename] = (
      curr_ending_idx,
      curr_ending_idx + len(file_embedding),
    )
    curr_ending_idx += len(file_embedding)

  all_embedding = np.concatenate(segments)
  assert len(all_embedding.shape) == 2
  assert all_embedding.shape == (curr_ending_idx, EMBEDDING_DIMENSION)

  # first, use PCA to reduce dimension.
  # then, use t-SNE for better visualization.
  all_embedding_2d = t_sne.fit_transform(pca.transform(all_embedding))
  bug_report_embedding_2d = all_embedding_2d[: len(bug_report_embedding)]
  file_embedding_2d: Dict[str, np.ndarray] = {}
  for filename, (frm, to) in segment_indices.items():
    file_embedding_2d[filename] = all_embedding_2d[frm: to]

  response = json.dumps({
    'fileEmbeddingsTSNE': file_embedding_2d,
    'bugReportEmbeddingTSNE': bug_report_embedding_2d,
  }, default=_default_json_serializer)

  print(f'Response size: {len(response) / 1024 ** 2:3f}', gc.collect())
  return response


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

  symmetric_similarity: Dict[str, np.ndarray] = {
    fn: bug_to_file_similarity[fn] + file_to_bug_similarity[fn]
    for fn in bug_to_file_similarity.keys()
  }

  top_files = list(sorted(
    symmetric_similarity.keys(),
    key=lambda fn: symmetric_similarity[fn],
    reverse=True,
  ))[:100]

  bug_locations = list(sorted(
    symmetric_similarity.items(),
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
    filename: pca.transform(file_embeddings[filename][top_word_i_of[filename]])
    for filename in top_files
  }

  # select data for response
  resp_file_tokens = {
    filename: [file_tokens_of[filename][i] for i in top_word_i_of[filename]]
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
    'fileEmbeddingsPCA': file_embedding_2d,
    'bugReportTokens': bug_report_tokens,
    'bugReportEmbeddingPCA': bug_report_embedding_2d,
    'wordToWordSimilarities': resp_word_to_word_similarities,
    'topWordIndices': top_word_i_of,
    'fileWordToBugSimilarity': resp_file_word_to_bug_similarity,
    'bugWordToFileSimilarities': chop_dict(
      bug_word_to_file_similarities, top_files),
    'bugReportToFileSimilarity': chop_dict(bug_to_file_similarity, top_files),
    'fileToBugReportSimilarity': chop_dict(file_to_bug_similarity, top_files),
    'symmetricSimilarity': chop_dict(symmetric_similarity, top_files),
    'bugLocations': bug_locations,
  }, default=_default_json_serializer)

  print(f'Response size: {len(response) / 1024 ** 2:3f}', gc.collect())
  return response


def _default_json_serializer(o):
  return o.round(6).tolist() if isinstance(o, np.ndarray) else o
