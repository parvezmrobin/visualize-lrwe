<template>
  <g id="legend" ref="legend">
    <rect x="10" y="10" width="5" height="5" :fill="Colors.Vermilion" />
    <text x="20" y="18" :fill="Colors.Vermilion">Maximum</text>
    <rect x="10" y="30" width="5" height="5" :fill="Colors.Blue" />
    <text x="20" y="38" :fill="Colors.Blue">Minimum</text>
  </g>
</template>
<script lang="ts">
import { Colors } from "@/utils";
import { select } from "d3";
import { defineComponent } from "vue";

export default defineComponent({
  name: "Legend",
  data() {
    return {
      Colors,
    };
  },
  methods: {
    adjustPosition(left: number, top: number) {
      select(this.$refs.legend as SVGGElement).attr(
        "transform",
        `translate(${left}, ${top})`
      );
    },
  },
});
</script>
