<template>
  <div class="container">
    <div class="row">
      <div class="col col-3">
        <LeftPanel />
      </div>
      <div class="col col-3">
        <FilePanel />
      </div>
      <div class="col col-6">
        <WordToWordSimilarity />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import FilePanel from "@/components/bug-localization/FilePanel.vue";
import LeftPanel from "@/components/bug-localization/LeftPanel.vue";
import WordToWordSimilarity from "@/components/bug-localization/WordToWordSimilarity.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "BugLocalization",
  components: { WordToWordSimilarity, FilePanel, LeftPanel },
});
</script>

<style scoped></style>
