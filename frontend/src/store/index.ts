import { createStore } from "vuex";

export interface SimilarityPayload {
  symmetricSimilarity: Record<string, number>;
  bugLocations: [string, number][];
  bugReportEmbeddingPCA: [number, number][];
  bugReportToFileSimilarity: Record<string, number>;
  bugReportTokens: string[];
  bugWordToFileSimilarities: Record<string, number[]>;
  fileEmbeddingsPCA: Record<string, [number, number][]>;
  fileToBugReportSimilarity: Record<string, number>;
  fileTokens: Record<string, string[]>;
  fileWordToBugSimilarity: Record<string, number[]>;
  wordToWordSimilarities: Record<string, number[][]>;
  topWordIndices: Record<string, number[]>;
}

export interface TSNEPayload {
  bugReportEmbeddingTSNE: [number, number][];
  fileEmbeddingsTSNE: Record<string, [number, number][]>;
}

export interface State {
  isLoading: boolean;
  selectedBug: "" | number;
  selectedFile: string;

  similarity?: SimilarityPayload;
  tSNE?: TSNEPayload;
}

export default createStore<State>({
  state() {
    return {
      isLoading: false,
      selectedBug: "",
      selectedFile: "",

      similarity: undefined,

      tSNE: undefined,
    };
  },
  getters: {
    filenames(self): string[] {
      return Object.keys(self.similarity?.symmetricSimilarity || {});
    },
  },
  mutations: {},
  actions: {
    updateSimilarityData(self, similarityPayload: SimilarityPayload) {
      self.state.similarity = similarityPayload;
    },

    updateTSNEData(self, tSNEData: TSNEPayload) {
      self.state.tSNE = tSNEData;
    },
  },
  modules: {},
});
