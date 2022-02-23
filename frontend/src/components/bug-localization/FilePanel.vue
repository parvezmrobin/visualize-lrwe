<template>
  <select class="form-control" v-model="selectedFile">
    <option value="" selected disabled>Select a file</option>
    <option
      :key="file"
      v-for="file in $store.state.files.slice(0, 100)"
      :value="file"
    >
      {{ file }}
    </option>
  </select>
</template>

<script lang="ts">
import axios from "axios";
import { defineComponent } from "vue";
import { mapState } from "vuex";

export default defineComponent({
  name: "FilePanel",
  data() {
    return {
      selectedFile: "",
    };
  },

  computed: {
    ...mapState(["selectedBug"]),
  },

  watch: {
    async selectedFile() {
      const resp = await axios.get(
        encodeURI(
          `/bug/${this.selectedBug}/word-similarities?file=${this.selectedFile}`
        )
      );
      console.log(resp.data);
    },
  },
});
</script>

<style scoped></style>
