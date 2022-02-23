<template>
  <svg ref="svg"></svg>
</template>

<script lang="ts">
import * as d3 from "d3";
import { defineComponent } from "vue";
import { mapState } from "vuex";

export default defineComponent({
  name: "WordToWordSimilarity",

  computed: {
    ...mapState([
      "fileEmbedding",
      "fileTokens",
      "bugReportEmbedding",
      "bugReportTokens",
      "similarities",
    ]),
  },

  watch: {
    similarities() {
      this.drawSimilarity();
    },
  },

  methods: {
    drawSimilarity() {
      const DOT_RADIUS = 3;

      const svg = this.$refs.svg as SVGElement;

      d3.select(svg).selectAll("g").remove();

      const min = Math.min(
        ...this.fileEmbedding.flat(),
        ...this.bugReportEmbedding.flat()
      );
      const max = Math.max(
        ...this.fileEmbedding.flat(),
        ...this.bugReportEmbedding.flat()
      );
      const xScale = d3
        .scaleLinear()
        .domain([min, max])
        .range([DOT_RADIUS, svg.clientWidth - DOT_RADIUS]);

      const yScale = d3
        .scaleLinear()
        .domain([min, max])
        .range([svg.clientWidth - DOT_RADIUS, DOT_RADIUS]);

      d3.select(svg)
        .append("g")
        .selectAll(".file.dot")
        .data(this.fileEmbedding)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale((d as number[])[0]))
        .attr("cy", (d) => yScale((d as number[])[1]))
        .attr("r", DOT_RADIUS)
        .style("fill", "magenta");

      d3.select(svg)
        .append("g")
        .selectAll(".br.dot")
        .data(this.bugReportEmbedding)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale((d as number[])[0]))
        .attr("cy", (d) => yScale((d as number[])[1]))
        .attr("r", DOT_RADIUS)
        .style("fill", "teal");
    },
  },

  mounted(): void {
    const svg = this.$refs.svg as SVGElement;
    svg.style.height = `${svg.clientWidth}px`;
    this.drawSimilarity();
  },
});
</script>

<style lang="scss" scoped>
svg {
  width: 100%;
}
</style>
