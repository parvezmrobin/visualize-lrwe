<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col col-4">
        <LeftPanel />
      </div>
      <div class="col col-8">
        <WordToWordSimilarity v-if="$store.state.selectedFile" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import LeftPanel from "@/components/bug-localization/LeftPanel.vue";
import WordToWordSimilarity from "@/components/bug-localization/WordToWordSimilarity.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "BugLocalization",
  components: { WordToWordSimilarity, LeftPanel },
});
</script>

<style scoped></style>
