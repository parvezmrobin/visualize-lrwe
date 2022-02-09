import shap
from flask import Flask, jsonify
from flask_cors import CORS
from sklearn.datasets import load_wine
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

app = Flask(__name__)
CORS(app)

wine_X, wine_y = load_wine(return_X_y=True, as_frame=True)
rf_model = RandomForestClassifier()
rf_model.fit(wine_X, wine_y)


@app.route('/shap-values/wine')
@app.route('/shap-values/wine/<index>')
def get_shap_values(index=None):  # put application's code here
  explainer = shap.Explainer(rf_model)
  shap_values = explainer(wine_X).values
  if index:
    index = int(index)
    assert index < shap_values.shape[0]
    shap_values = shap_values[index]
  return jsonify(header=list(wine_X.columns), values=shap_values.tolist())


if __name__ == '__main__':
  app.run()
