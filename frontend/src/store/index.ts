import { createStore } from "vuex";

export interface SimilarityPayload {
  fileTokens: string[];
  fileEmbedding: number[][];
  bugReportTokens: string[];
  bugReportEmbedding: number[][];
  similarities: number[][];
}

export interface State extends SimilarityPayload {
  selectedBug: "" | number;
  files: string[];
}

export default createStore<State>({
  state() {
    return {
      selectedBug: "",
      files: [],
      fileTokens: [],
      fileEmbedding: [],
      bugReportTokens: [],
      bugReportEmbedding: [],
      similarities: [],
    };
  },
  mutations: {},
  actions: {
    updateFiles(self, files) {
      self.state.files = files;
    },
    updateSimilarityData(self, similarityPayload: SimilarityPayload) {
      self.state.fileTokens = similarityPayload.fileTokens;
      self.state.fileEmbedding = similarityPayload.fileEmbedding;
      self.state.bugReportTokens = similarityPayload.bugReportTokens;
      self.state.bugReportEmbedding = similarityPayload.bugReportEmbedding;
      self.state.similarities = similarityPayload.similarities;
    },
  },
  modules: {},
});
