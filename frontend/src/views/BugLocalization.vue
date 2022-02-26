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
import Visualization from "@/views/Visualization.vue";
import { scaleLinear, ScaleLinear } from "d3";
import { defineComponent } from "vue";
import { mapState } from "vuex";

export default defineComponent({
  name: "BugLocalization",
  components: { Visualization, LeftPanel },
  computed: {
    ...mapState(["bugLocations"]),
    colorScale(): ScaleLinear<string, string> {
      const similarities = this.bugLocations.map(
        (location: [string, number]) => location[1]
      );
      return scaleLinear<string>()
        .domain([Math.min(...similarities), Math.max(...similarities)])
        .range(["lightyellow", "coral"]);
    },
    fileColor(): Record<string, [string, string]> {
      const fileColor: Record<string, [string, string]> = {};
      for (const [filename] of this.bugLocations) {
        const similarity = this.bugLocations.find(
          (location: string) => location[0] === filename
        )[1];
        const background = this.colorScale(similarity);
        const values = background
          .match(/rgb\((\d+), (\d+), (\d+)\)/)
          ?.slice(1)
          .map((v) => 255 - Number.parseInt(v));
        const foreground = `rgb(${values?.join(", ")})`;
        fileColor[filename] = [background, foreground];
      }

      return fileColor;
    },
  },
});
</script>
