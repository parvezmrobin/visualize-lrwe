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
import { defineComponent } from "vue";

export default defineComponent({
  name: "FilePanel",
  data() {
    return {
      selectedFile: "",
    };
  },
});
</script>

<style scoped></style>
