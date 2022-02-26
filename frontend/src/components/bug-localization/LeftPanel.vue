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

  <div class="mb-3 col-auto" v-show="bugLocations.length">
    <table class="table" style="word-break: break-word">
      <thead>
        <tr>
          <th>Bug Location</th>
          <th>Similarity Score</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="bugLocation in bugLocations"
          :key="bugLocation[0]"
          :style="{ backgroundColor: fileColor[bugLocation[0]] }"
        >
          <td>
            <code :style="{ color: 'white' }">
              {{ bugLocation[0] }}
            </code>
          </td>
          <td>{{ bugLocation[1].toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!--  Loading indicator -->
  <div ref="loadingModal" class="modal" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-body d-flex justify-content-center">
          <div
            class="spinner-grow text-info"
            style="width: 5rem; height: 5rem"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { SimilarityPayload } from "@/store";
import axios from "axios";
import { Modal } from "bootstrap";
import { defineComponent, PropType } from "vue";
import { mapState } from "vuex";

type BugSummaryResponse = {
  bug_id: Record<string, number>;
  summary: Record<string, string>;
};
type BugSummary = { bug_id: number; summary: string };

export default defineComponent({
  name: "LeftPanel",
  props: {
    fileColor: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
  },
  data() {
    return {
      bugs: [] as BugSummary[],
    };
  },

  computed: {
    ...mapState(["bugLocations"]),
    selectedBug: {
      get() {
        return this.$store.state.selectedBug;
      },
      set(value: number) {
        this.$store.state.selectedBug = value;
      },
    },
  },

  watch: {
    async selectedBug() {
      const loadingModal = Modal.getOrCreateInstance(
        this.$refs.loadingModal as HTMLDivElement
      );
      loadingModal.show();

      this.$store.state.selectedFile = "";
      this.$store.state.asymmetricSimilarity = {};
      const resp = await axios.get<SimilarityPayload>(
        encodeURI(`/bug/${this.selectedBug}/similarities`)
      );
      console.log(resp.data);
      await this.$store.dispatch("updateSimilarityData", resp.data);

      loadingModal.hide();
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

<style scoped>
.modal-content {
  background-color: transparent;
  border: none;
}
</style>
