import { createStore } from "vuex";

export interface SimilarityPayload {
  asymmetricSimilarity: Record<string, number>;
  bugLocations: [string, number][];
  bugReportEmbedding: [number, number][];
  bugReportToFileSimilarity: Record<string, number>;
  bugReportTokens: string[];
  bugWordToFileSimilarities: Record<string, number[]>;
  fileEmbeddings: Record<string, [number, number][]>;
  fileToBugReportSimilarity: Record<string, number>;
  fileTokens: Record<string, string[]>;
  fileWordToBugSimilarity: Record<string, number[]>;
  wordToWordSimilarities: Record<string, number[][]>;
}

export interface State extends SimilarityPayload {
  selectedBug: "" | number;
  selectedFile: string;
}

export default createStore<State>({
  state() {
    return {
      selectedBug: "",
      selectedFile: "",
      asymmetricSimilarity: {},
      bugLocations: [],
      bugReportEmbedding: [],
      bugReportToFileSimilarity: {},
      bugReportTokens: [],
      bugWordToFileSimilarities: {},
      fileEmbeddings: {},
      fileToBugReportSimilarity: {},
      fileTokens: {},
      fileWordToBugSimilarity: {},
      wordToWordSimilarities: {},
    };
  },
  mutations: {},
  actions: {
    updateSimilarityData(self, similarityPayload: SimilarityPayload) {
      self.state.asymmetricSimilarity = similarityPayload.asymmetricSimilarity;
      self.state.bugLocations = similarityPayload.bugLocations;
      self.state.bugReportEmbedding = similarityPayload.bugReportEmbedding;
      self.state.bugReportToFileSimilarity =
        similarityPayload.bugReportToFileSimilarity;
      self.state.bugReportTokens = similarityPayload.bugReportTokens;
      self.state.bugWordToFileSimilarities =
        similarityPayload.bugWordToFileSimilarities;
      self.state.fileEmbeddings = similarityPayload.fileEmbeddings;
      self.state.fileToBugReportSimilarity =
        similarityPayload.fileToBugReportSimilarity;
      self.state.fileTokens = similarityPayload.fileTokens;
      self.state.fileWordToBugSimilarity =
        similarityPayload.fileWordToBugSimilarity;
      self.state.wordToWordSimilarities =
        similarityPayload.wordToWordSimilarities;
    },
  },
  modules: {},
});
