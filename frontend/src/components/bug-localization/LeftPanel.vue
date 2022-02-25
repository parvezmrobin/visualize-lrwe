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

  <div class="mb-3 col-auto" v-show="files.length">
    <label for="select-file" class="form-label">Select A File</label>
    <select v-model="selectedFile" class="form-control" id="select-file">
      <option
        :key="file"
        v-for="file in files.slice(0, 100)"
        :value="file"
        :style="{ backgroundColor: getFileBackground(file) }"
      >
        {{ file }}
      </option>
    </select>
  </div>

  <div class="mb-3 col-auto" v-show="files.length">
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
          :style="{ backgroundColor: getFileBackground(bugLocation[0]) }"
        >
          <td>
            <code :style="{ color: getFileForeground(bugLocation[0]) }">
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
import { defineComponent } from "vue";
import { scaleLinear, ScaleLinear } from "d3";
import { mapState } from "vuex";
import { Modal } from "bootstrap";

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
    ...mapState(["bugLocations"]),
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
    files(): string[] {
      return Object.keys(this.$store.state.asymmetricSimilarity);
    },
    mostSimilarFilenames(): string[] {
      return this.bugLocations.map((location: [string, number]) => location[0]);
    },
    mostSimilarSimilarities(): number[] {
      return this.bugLocations.map((location: [string, number]) => location[1]);
    },
    colorScale(): ScaleLinear<string, string> {
      const similarities = this.bugLocations
        ? this.mostSimilarSimilarities
        : [0];
      return scaleLinear<string>()
        .domain([Math.min(...similarities), Math.max(...similarities)])
        .range(["lightyellow", "coral"]);
    },
  },

  watch: {
    async selectedBug() {
      const loadingModal = Modal.getOrCreateInstance(
        this.$refs.loadingModal as HTMLDivElement
      );
      loadingModal.show();

      this.selectedFile = "";
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

  methods: {
    getFileBackground(filename: string) {
      const fileIndex = this.mostSimilarFilenames.indexOf(filename);
      if (fileIndex === -1) {
        return "white";
      }

      const backgroundColor = this.colorScale(
        this.mostSimilarSimilarities[fileIndex]
      );
      return backgroundColor;
    },

    getFileForeground(filename: string) {
      const background = this.getFileBackground(filename);
      const values = background
        .match(/rgb\((\d+), (\d+), (\d+)\)/)
        ?.slice(1)
        .map((v) => 255 - Number.parseInt(v));
      return `rgb(${values?.join(", ")})`;
    },
  },
});
</script>

<style scoped>
.modal-content {
  background-color: transparent;
  border: none;
}

</style>
