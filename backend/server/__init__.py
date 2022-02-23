import os
from typing import Dict

import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS

from server.utils import get_embedding_index, checkout_to, get_java_files_from, \
  get_embeddings, get_embedding_of_file

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


@app.route('/bug/<bug_id>/files')
def get_file_list_for_bug(bug_id):
  bug_row = tomcat_df[tomcat_df.bug_id == int(bug_id)].iloc[0]
  commit = bug_row.commit
  checkout_to(commit, TOMCAT_REPO_DIR)
  file_map = dict(get_java_files_from(TOMCAT_REPO_DIR))
  return jsonify(list(file_map.keys()))


@app.route('/bug/<bug_id>/word-similarities')
def get_word_similarities(bug_id):
  pass
