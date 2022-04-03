<template>
  <label for="select-file" class="col-auto col-form-label">Select A File</label>
  <div :class="colClass">
    <select class="form-control" id="select-file" v-model="selectedFile">
      <option
        :key="file"
        v-for="file in filenames"
        :value="file"
        :style="{ backgroundColor: getFileBackground(file) }"
      >
        {{ file }}
      </option>
    </select>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
import { mapGetters } from "vuex";

export default defineComponent({
  name: "SelectFile",
  props: {
    fileColor: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
    colClass: {
      type: String,
      default: "col-sm-6",
    },
  },
  computed: {
    ...mapGetters(["filenames"]),
    selectedFile: {
      get() {
        return this.$store.state.selectedFile;
      },
      set(value: string) {
        this.$store.state.selectedFile = value;
      },
    },
  },
  methods: {
    getFileBackground(filename: string) {
      const fileColor = this.fileColor[filename];
      if (!fileColor) {
        return "transparent";
      }

      return fileColor;
    },
  },
});
</script>
<style lang="scss" scoped>
svg {
  width: 100%;
}
</style>
