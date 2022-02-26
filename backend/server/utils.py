import os
import pathlib
import subprocess
from typing import Dict, Generator, Tuple, Union, List, Iterable, Any, Generic, \
  TypeVar

import numpy as np
from keras.utils.data_utils import get_file
import re

from nltk.tokenize import wordpunct_tokenize
from nltk.stem import PorterStemmer
from nltk.corpus import stopwords as stopwords_loader

EMBEDDING_DIMENSION = 100
_stemmer = PorterStemmer()
stopwords = stopwords_loader.words('english')


def ensure_glove_embedding(verbose=False):
  embedding_data_path = get_file(
    'glove.6B.zip',
    'https://nlp.stanford.edu/data/glove.6B.zip',
    untar=True,
    extract=True,
  )

  # If this operation fails, print the parent-dir
  # go there, and extract the file
  file_path = pathlib.Path(
    embedding_data_path).parent / f'glove.6B.{EMBEDDING_DIMENSION}d.txt'

  if verbose:
    with open(file_path, encoding='utf-8') as glove_embedding_file:
      for i in range(5):
        line = glove_embedding_file.readline()
        word, *embedding = line.split()
        print(
          'Word:', word,
          '| Embedding length:', len(embedding),
          '| Average embedding:', sum(map(float, embedding)) / len(embedding),
        )

  return file_path


FileEmbeddings = Dict[str, np.ndarray]


def create_embedding_index(embedding_file_path: pathlib.Path, verbose=False):
  if verbose:
    from tqdm import tqdm

    # there are 400K words, and we will update progress
    # on every 1000 word read
    progress_bar = tqdm(total=400000)

  _embedding_index: FileEmbeddings = {}
  with open(embedding_file_path, encoding='utf-8') as embedding_file:
    for line in embedding_file:
      word, coefficients = line.split(maxsplit=1)
      coefficients = np.fromstring(coefficients, 'float', sep=' ')
      _embedding_index[word] = coefficients

      if verbose:
        progress_bar.update(1)

  if verbose:
    progress_bar.close()

  if verbose:
    print(f'Found {len(_embedding_index)} words in the embedding.')
    print(f'Embedding dimension: {len(next(iter(_embedding_index.values())))}')

  return _embedding_index


def get_embedding_index():
  return create_embedding_index(ensure_glove_embedding())


def checkout_to(commit, cwd):
  """
  TODO: add directory specific lock support
  """
  try:
    subprocess.run(
      f'git checkout {commit}',
      shell=True,
      cwd=cwd,
      capture_output=True,
      check=True,
      encoding='utf-8',
    )
  except subprocess.CalledProcessError as e:
    print(e.stderr)
    raise


def get_java_files_from(
    repo: str, no_prefix=False, ignore_test_files=False,
) -> Generator[Tuple[str, str], None, None]:
  for root, dirs, files in os.walk(repo):
    for file in files:
      if not file.endswith('.java'):
        continue
      if ignore_test_files and 'test' in file.lower():
        continue
      with open(os.path.join(root, file)) as java_file:
        filepath = os.path.join(root, file)
        if no_prefix:
          yield filepath[len(repo) + 1:], java_file.read()
        else:
          yield filepath, java_file.read()


def get_word_tokens(t: str):
  if re.match('^[A-Z_]+$', t):
    return t.split('_')
  return re.split('(?=[A-Z])', t)


def get_embedding_of_file(
  file: str,
  embedding_index: Dict[str, np.ndarray],
  return_tokens=False,
  return_found_ratio=False,
) -> Union[np.ndarray, Tuple]:
  """
  In AspectJ, statistics of finding embedding before and after applying stemming
  Improvement in: 144
  Degradation in: 71
  Total improvement: 6.44820508652104
  Total degradation: 1.9593396383608064
  Avg improvement: 0.04477920198972944
  Avg degradation: 0.027596332934659244

  Therefore, stemming will be used
  """
  tokens = wordpunct_tokenize(file)
  identifier_tokens = filter(
    lambda w: w.isalnum() and not w.isnumeric(), tokens,
  )
  word_tokens = (w for t in identifier_tokens for w in get_word_tokens(t))
  stemmed_tokens = [_stemmer.stem(w) for w in word_tokens if w]
  runwords = [w for w in stemmed_tokens if w not in stopwords]
  found_ratio = 0
  embedding = np.zeros((len(runwords), EMBEDDING_DIMENSION))
  for i, stemmed_token in enumerate(runwords):
    if stemmed_token in embedding_index.keys():
      embedding[i] = embedding_index[stemmed_token]
      found_ratio += 1
  found_ratio /= len(runwords)

  ret = [embedding]
  if return_tokens:
    ret.append(runwords)

  if return_found_ratio:
    ret.append(found_ratio)

  return embedding if len(ret) == 1 else ret


def get_embeddings(
  file_map: Union[Dict[str, str], Generator[Tuple[str, str], None, None]],
  embedding_index: Dict[str, np.ndarray],
  return_tokens=True,
  return_found_ratio=False,
) -> Union[FileEmbeddings, Tuple]:
  if isinstance(file_map, dict):
    file_map = file_map.items()

  file_embeddings: FileEmbeddings = {}
  file_tokens = {}
  found_ratios = []

  for filename, file in file_map:
    embedding, stemmed_tokens, found_ratio = get_embedding_of_file(
      file,
      embedding_index,
      return_tokens=True,
      return_found_ratio=True,
    )
    file_embeddings[filename] = embedding
    file_tokens[filename] = stemmed_tokens
    found_ratios.append(found_ratio)

  ret = [file_embeddings]

  if return_tokens:
    ret.append(file_tokens)
  if return_found_ratio:
    ret.append(found_ratios)
  return file_embeddings if len(ret) == 1 else ret


def chop_dict(
  d: Dict[str, Any], keys: Iterable[str],
) -> Dict[str, Any]:
  return {key: d[key] for key in keys}


_KT = TypeVar('_KT')
_VT = TypeVar('_VT')


def first_key_of(d: Dict[_KT, _VT]) -> _KT:
  return next(iter(d.keys()))


def first_value_of(d: Dict[_KT, _VT]) -> _VT:
  return next(iter(d.values()))
