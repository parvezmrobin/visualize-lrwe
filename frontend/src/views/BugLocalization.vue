<template>
  <div class="container">
    <div class="row">
      <h1>Bug Localization</h1>
      <div class="col col-4">
        <LeftPanel />
      </div>
      <div class="col col-4">
        <FilePanel />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import FilePanel from "@/components/bug-localization/FilePanel.vue";
import LeftPanel from "@/components/bug-localization/LeftPanel.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "BugLocalization",
  components: { FilePanel, LeftPanel },
});
</script>

<style scoped></style>
