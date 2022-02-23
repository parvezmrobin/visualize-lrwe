import os
from typing import Dict

import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS

from server.utils import get_embedding_index

os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

app = Flask(__name__)
CORS(app)

TOMCAT_REPO_DIR = './dataset/lr+we/repo/eclipse.jdt.ui'
TOMCAT_DATA_FILE = './dataset/lr+we/dataset/tomcat.xlsx'

dataframes: Dict[str, pd.DataFrame] = {}
tomcat_df = pd.read_excel(TOMCAT_DATA_FILE)
dataframes['tomcat'] = tomcat_df

embedding_index = get_embedding_index()


@app.route('/bug', methods=['GET'])
def get_bug_ids():
  summary = tomcat_df[['bug_id', 'summary']].to_dict()
  return jsonify(summary)


@app.route('/bug/<bug_id>/word-similarities')
def get_word_similarities(bug_id):
  pass
