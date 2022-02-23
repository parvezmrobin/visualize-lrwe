import os
from typing import Dict

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.decomposition import PCA
from sklearn.metrics.pairwise import cosine_similarity

from server.utils import get_embedding_index, checkout_to, \
  get_java_files_from, get_embeddings, get_embedding_of_file

os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
assert os.getcwd().endswith('backend')

app = Flask(__name__)
CORS(app)

TOMCAT_REPO_DIR = './dataset/lr+we/repo/tomcat'
TOMCAT_DATA_FILE = './dataset/lr+we/dataset/Tomcat.xlsx'

dataframes: Dict[str, pd.DataFrame] = {}
tomcat_df = pd.read_excel(TOMCAT_DATA_FILE)
dataframes['tomcat'] = tomcat_df

embedding_index = get_embedding_index()


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


@app.route('/bug/<bug_id>/word-similarities')
def get_word_similarities(bug_id):
  bug_row = tomcat_df[tomcat_df.bug_id == int(bug_id)].iloc[0]
  commit = bug_row.commit
  bug_report = bug_row.summary
  if isinstance(bug_row.description, str):
    bug_report += ('\n' + bug_row.description)

  similar_filename = request.args.get('file')
  checkout_to(commit, TOMCAT_REPO_DIR)
  with open(os.path.join(TOMCAT_REPO_DIR, similar_filename)) as similar_file:
    file_content = similar_file.read()
  file_embedding, file_tokens = get_embedding_of_file(
    file_content, embedding_index, return_stemmed_tokens=True,
  )
  bug_report_embedding, bug_report_tokens = get_embedding_of_file(
    bug_report, embedding_index, return_stemmed_tokens=True,
  )
  similarities = cosine_similarity(bug_report_embedding, file_embedding)

  pca = PCA(n_components=2)
  pca.fit(np.concatenate([file_embedding, bug_report_embedding], axis=0))
  file_embedding_2d = pca.transform(file_embedding)
  bug_report_embedding_2d = pca.transform(bug_report_embedding)

  return jsonify({
    'file_tokens': file_tokens,
    'file_embedding': file_embedding_2d.tolist(),
    'bug_report_tokens': bug_report_tokens,
    'bug_report_embedding': bug_report_embedding_2d.tolist(),
    'similarities': similarities.tolist(),
  })
