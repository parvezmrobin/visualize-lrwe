<template>
  <div class="container">
    <div class="row">
      <h1>Bug Localization</h1>
      <div class="col col-4">
        <LeftPanel />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import LeftPanel from "@/components/bug-localization/LeftPanel.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "BugLocalization",
  components: { LeftPanel },
});
</script>

<style scoped></style>
