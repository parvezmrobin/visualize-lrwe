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
  ndarray_dict_to_primitive

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
pca = PCA(n_components=2)
pca.fit(np.stack(list(embedding_index.values()), axis=0))


@app.route('/bug', methods=['GET'])
def get_bug_ids():
  summary = tomcat_df[['bug_id', 'summary']].to_dict()
  return jsonify(summary)


@app.route('/bug/<bug_id>/file')
def get_file_list_for_bug(bug_id):
  bug_row = tomcat_df[tomcat_df.bug_id == int(bug_id)].iloc[0]
  commit = bug_row.commit
  checkout_to(commit, TOMCAT_REPO_DIR)
  file_map = dict(get_java_files_from(TOMCAT_REPO_DIR, no_prefix=True))
  return jsonify(list(file_map.keys()))


@app.route('/bug/<bug_id>/similarities')
def get_word_similarities(bug_id):
  # gather necessary data
  bug_row = tomcat_df[tomcat_df.bug_id == int(bug_id)].iloc[0]
  commit = bug_row.commit
  bug_report = bug_row.summary
  if isinstance(bug_row.description, str):
    bug_report += ('\n' + bug_row.description)

  checkout_to(commit, TOMCAT_REPO_DIR)
  file_map = dict(get_java_files_from(TOMCAT_REPO_DIR, no_prefix=True))

  # generate tokens and embeddings
  file_embeddings: FileEmbeddings
  file_tokens_of: Dict[str, List[str]]
  file_embeddings, file_tokens_of = get_embeddings(
    file_map, embedding_index, return_stemmed_tokens=True,
  )
  del file_map

  bug_report_embedding: np.ndarray
  bug_report_tokens: List[str]
  bug_report_embedding, bug_report_tokens = get_embedding_of_file(
    bug_report, embedding_index, return_stemmed_tokens=True,
  )

  # reduce dimensionality
  file_embedding_2d = {
    filename: pca.transform(file_embedding).tolist()
    for filename, file_embedding in file_embeddings.items()
  }
  bug_report_embedding_2d = pca.transform(bug_report_embedding).tolist()

  # compute similarities
  word_to_word_similarities: Dict[str, np.ndarray] = {
    filename: cosine_similarity(bug_report_embedding, file_embedding)
    for filename, file_embedding in file_embeddings.items()
  }
  del bug_report_embedding, file_embeddings

  # 0th axis is bug-report axis. Therefore, reducing over axis 1 will give
  # maximum similarity for each bug word
  bug_word_to_file_similarities: Dict[str, np.ndarray] = {
    filename: np.max(word_to_word_similarity, axis=1)
    for filename, word_to_word_similarity in word_to_word_similarities.items()
  }

  # ignoring words that had a zero similarity with the target document,
  # i.e. words that either do not have a word embedding, or that do not
  # appear in the target document.
  known_bug_report_tokens = set(token for token in bug_report_tokens
                                if token in embedding_index.keys())
  common_words_count_of: Dict[str, float] = {}
  for filename, file_tokens in file_tokens_of.items():
    common_words = tuple(token for token in known_bug_report_tokens
                         if token in file_tokens)
    common_words_count_of[filename] = len(common_words) + 1e-6

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

  # 1st axis is bug-report axis. Therefore, reducing over axis 0 will give
  # maximum similarity for each file word
  file_word_to_bug_similarities: Dict[str, np.ndarray] = {
    filename: np.max(word_to_word_similarity, axis=0)
    for filename, word_to_word_similarity in word_to_word_similarities.items()
  }
  file_to_bug_similarity: Dict[str, np.ndarray] = {
    fn: (np.sum(file_word_to_bug_sim) / common_words_count_of[fn])
    for fn, file_word_to_bug_sim in file_word_to_bug_similarities.items()
  }

  asymmetric_similarity: Dict[str, np.ndarray] = {
    fn: bug_to_file_similarity[fn] + file_to_bug_similarity[fn]
    for fn in bug_to_file_similarity.keys()
  }

  most_similar_100_files = list(sorted(
    asymmetric_similarity.keys(),
    key=lambda fn: asymmetric_similarity[fn],
    reverse=True,
  ))[:100]

  return jsonify({
    'fileTokens': file_tokens_of,
    'fileEmbedding': file_embedding_2d,
    'bugReportTokens': bug_report_tokens,
    'bugReportEmbedding': bug_report_embedding_2d,
    'wordToWordSimilarities': ndarray_dict_to_primitive(
      word_to_word_similarities, most_similar_100_files),
    'fileWordToBugSimilarity': ndarray_dict_to_primitive(
      file_word_to_bug_similarities, most_similar_100_files),
    'bugWordToFileSimilarities': ndarray_dict_to_primitive(
      bug_word_to_file_similarities, most_similar_100_files),
    'bugReportToFileSimilarity': ndarray_dict_to_primitive(
      bug_to_file_similarity, most_similar_100_files),
    'fileToBugReportSimilarity': ndarray_dict_to_primitive(
      file_to_bug_similarity, most_similar_100_files),
    'asymmetricSimilarity': ndarray_dict_to_primitive(
      asymmetric_similarity, most_similar_100_files),
  })
