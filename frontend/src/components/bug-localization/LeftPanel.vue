<template>
  <div class="mb-3 col-auto">
    <label for="select-bug" class="form-label">Select A Bug</label>
    <select v-model="selectedBug" class="form-control" id="select-bug">
      <option
        :key="bug.bug_id"
        v-for="bug in bugs.slice(0, 100)"
        :value="bug.bug_id"
      >
        {{ bug.summary }}
      </option>
    </select>
  </div>

  <div class="mb-3" v-show="files.length">
    <label for="select-file" class="form-label">Select A File</label>
    <select v-model="selectedFile" class="form-control" id="select-file">
      <option :key="file" v-for="file in files.slice(0, 100)" :value="file">
        {{ file }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import { SimilarityPayload } from "@/store";
import axios from "axios";
import { defineComponent } from "vue";

type BugSummaryResponse = {
  bug_id: Record<string, number>;
  summary: Record<string, string>;
};
type BugSummary = { bug_id: number; summary: string };
export default defineComponent({
  name: "LeftPanel",
  data() {
    return {
      bugs: [] as BugSummary[],
    };
  },

  computed: {
    files(): string[] {
      return Object.keys(this.$store.state.asymmetricSimilarity);
    },
    selectedBug: {
      get() {
        return this.$store.state.selectedBug;
      },
      set(value) {
        this.$store.state.selectedBug = value;
      },
    },
    selectedFile: {
      get() {
        return this.$store.state.selectedFile;
      },
      set(value) {
        this.$store.state.selectedFile = value;
      },
    },
  },

  watch: {
    async selectedBug() {
      const resp = await axios.get<SimilarityPayload>(
        encodeURI(`/bug/${this.selectedBug}/similarities`)
      );
      console.log(resp.data);
      await this.$store.dispatch("updateSimilarityData", resp.data);
    },
  },

  async mounted() {
    const resp = await axios.get<BugSummaryResponse>(`/bug`);
    this.bugs = Object.entries(resp.data.bug_id).map(([i, bug_id]) => ({
      bug_id,
      summary: resp.data.summary[i],
    }));
  },
});
</script>

<style scoped></style>
