import { createStore } from "vuex";

export interface State {
  files: string[];
}

export default createStore<State>({
  state() {
    return {
      selectedBug: '',
      files: [],
    };
  },
  mutations: {},
  actions: {
    updateFiles(self, files) {
      self.state.files = files;
    },
  },
  modules: {},
});
