<template>
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li
        :key="tab"
        v-for="tab in tabs"
        class="breadcrumb-item"
        :class="{ active: tab !== activeTab }"
      >
        <a href="#" v-if="tab !== activeTab" @click="activeTab = tab">
          {{ tab }}
        </a>
        <template v-else> {{ tab }}</template>
      </li>
    </ol>
  </nav>
  <WordToWordSimilarity
    v-if="activeTab === 'Word To Word Similarity'"
    :fileColor="fileColor"
  />
  <WordToFileSimilarity v-else-if="activeTab === 'Word To File Similarity'" />
  <WordToBugReportSimilarity
    v-else-if="activeTab === 'Word To Bug Report Similarity'"
    :fileColor="fileColor"
  />
</template>
<script lang="ts">
import WordToWordSimilarity from "@/components/bug-localization/WordToWordSimilarity.vue";
import WordToFileSimilarity from "@/components/bug-localization/WordToFileSimilarity.vue";
import WordToBugReportSimilarity from "@/components/bug-localization/WordToBugReportSimilarity.vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "Visualization",
  components: {
    WordToFileSimilarity,
    WordToWordSimilarity,
    WordToBugReportSimilarity,
  },
  props: {
    fileColor: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
  },
  data() {
    return {
      tabs: [
        "Word To Word Similarity",
        "Word To File Similarity",
        "Word To Bug Report Similarity",
        "Bug Report To File Similarity",
      ],
      activeTab: "Word To Word Similarity",
    };
  },
});
</script>

<style scoped lang="scss">
nav {
  --bs-breadcrumb-divider: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><path d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/></svg>");
}
</style>
