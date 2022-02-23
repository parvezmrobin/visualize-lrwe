<template>
  <select class="form-control">
    <option :key="bug.bug_id" v-for="bug in bugs.slice(0, 100)">
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
  data(): { bugs: BugSummary[] } {
    return {
      bugs: [],
    };
  },

  async mounted() {
    const resp = await axios.get<BugSummaryResponse>(
      `http://${window.location.hostname}:5000/bug`
    );
    this.bugs = Object.entries(resp.data.bug_id).map(([i, bug_id]) => ({
      bug_id,
      summary: resp.data.summary[i],
    }));
  },
});
</script>

<style scoped></style>
