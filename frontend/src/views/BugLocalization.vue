<template>
  <div class="container-fluid p-3">
    <div class="row">
      <div class="col col-4">
        <LeftPanel :fileColor="fileColor" />
      </div>
      <div class="col col-8">
        <Visualization v-if="$store.state.selectedBug" :fileColor="fileColor" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import LeftPanel from "@/components/bug-localization/LeftPanel.vue";
import Visualization from "@/components/bug-localization/Visualization.vue";
import { interpolateLab, scaleLinear, ScaleLinear } from "d3";
import { defineComponent } from "vue";
import { mapState } from "vuex";

export default defineComponent({
  name: "BugLocalization",
  components: { Visualization, LeftPanel },
  computed: {
    ...mapState(["similarity"]),
    colorScale(): ScaleLinear<string, string> | undefined {
      if (!this.similarity) {
        return undefined;
      }
      const similarities = this.similarity.bugLocations.map(
        (location: [string, number]) => location[1]
      );
      return scaleLinear<string>()
        .domain([Math.min(...similarities), Math.max(...similarities)])
        .range(["#0c5ea022", "#e01e1cee"])
        .interpolate(interpolateLab);
    },
    fileColor(): Record<string, string> {
      const fileColor: Record<string, string> = {};
      if (!this.colorScale) {
        return fileColor;
      }
      for (const [filename] of this.similarity.bugLocations) {
        const similarity = this.similarity.bugLocations.find(
          (location: [string, number]) => location[0] === filename
        )[1];
        fileColor[filename] = this.colorScale(similarity);
      }

      return fileColor;
    },
  },
});
</script>
