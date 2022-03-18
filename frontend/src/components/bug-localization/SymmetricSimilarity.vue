<template>
  <svg class="border border-info rounded" ref="svg"></svg>
</template>

<script lang="ts">
import { computeSvgSize, D3Selection } from "@/utils";
import * as d3 from "d3";
import { defineComponent } from "vue";

type Datum = {
  filename: string;
  similarity: number;
};

const margin = {
  left: 150,
  right: 10,
  y: 10,
};

export default defineComponent({
  name: "SymmetricSimilarity",

  computed: {
    similarity(): Datum[] {
      if (!this.$store.state.similarity) {
        return [];
      }
      const { symmetricSimilarity } = this.$store.state.similarity;
      return Object.entries(symmetricSimilarity)
        .slice(0, 30)
        .map(([filename, similarity]) => ({
          filename,
          similarity,
        }));
    },
  },

  watch: {
    similarity() {
      this.drawSimilarity();
    },
  },

  mounted(): void {
    this.drawSimilarity();
  },

  methods: {
    drawSimilarity() {
      const d3Svg = d3.select(this.$refs.svg as SVGElement);
      const size = computeSvgSize(d3Svg.node() as SVGElement);
      d3Svg.style("height", `${size}px`).style("width", `${size}px`);

      const similarities = this.similarity.map(({ similarity }) => similarity);
      const similarityDomain = [
        Math.min(...similarities),
        Math.max(...similarities),
      ];

      const xScale = d3
        .scaleLinear()
        .domain(similarityDomain)
        .range([margin.left, size - margin.left - margin.right]);

      const yScale = d3
        .scaleBand()
        .domain(this.similarity.map(({ filename }) => filename))
        .range([margin.y, size - margin.y])
        .padding(0.1)
        .paddingOuter(0);

      const barColorScale = d3
        .scaleLinear<string>()
        .domain(similarityDomain)
        .range(["lightseagreen", "#aa1123"]);

      const bars = d3Svg.selectAll("rect.bar").data(this.similarity);
      bars.exit().remove();
      bars.enter().append("rect").attr("class", "bar");

      d3Svg
        .selectAll<SVGRectElement, Datum>("rect.bar")
        .transition()
        .attr("x", margin.left)
        .attr("y", (d) => yScale(d.filename) as number)
        .attr("width", (d) => xScale(d.similarity))
        .attr("height", yScale.bandwidth)
        .attr("rx", 5)
        .attr("ry", 2)
        .style("fill", (d) => barColorScale(d.similarity));

      let axis: D3Selection<SVGGElement> = d3Svg.select(".axis");
      if (axis.empty()) {
        axis = d3Svg
          .append("g")
          .attr("class", "axis")
          .attr("transform", `translate(${margin.left}, 0)`)
          .call(d3.axisLeft(yScale).tickSizeOuter(0));
      } else {
        axis.transition().call(d3.axisLeft(yScale).tickSizeOuter(0));
      }

      const getFilenameFromDatum = (d: string) => {
        return d.replaceAll("\\", "/").split("/").slice(-1)[0];
      };
      axis.selectAll<SVGTextElement, string>("text").text(getFilenameFromDatum);
    },
  },
});
</script>

<style scoped lang="scss"></style>
