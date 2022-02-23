<template>
  <select v-model="selectedBug" class="form-control">
    <option value="" selected disabled>Select a bug</option>
    <option
      :key="bug.bug_id"
      v-for="bug in bugs.slice(0, 100)"
      :value="bug.bug_id"
    >
      {{ bug.summary }}
    </option>
  </select>
</template>

<script lang="ts">
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
      selectedBug: "",
    };
  },

  watch: {
    async selectedBug() {
      const resp = await axios.get(`/bug/${this.selectedBug}/files`);
      console.log(resp.data);
      await this.$store.dispatch("updateFiles", resp.data);
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
