<template>
  <svg ref="svg"></svg>
  <div ref="popperBugReport" class="popper br" hidden></div>
  <div ref="popperFile" class="popper file" hidden></div>
</template>

<script lang="ts">
import * as d3 from "d3";
import { defineComponent } from "vue";
import { mapState } from "vuex";
import { createPopper } from "@popperjs/core";

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

      type ShowPopper = (e: MouseEvent, point: [number, number]) => void;

      const createShowPopperFunction = (
        embedding: [number, number][],
        popper: HTMLDivElement
      ): ShowPopper => {
        return (e: MouseEvent, point) => {
          const index = embedding.indexOf(point);
          const word = this.bugReportTokens[index];

          popper.hidden = false;
          popper.innerText = word;

          createPopper(e.target as HTMLElement, popper, {
            placement: "right",
          });
        };
      };

      d3.select(svg)
        .append("g")
        .selectAll(".file.dot")
        .data<[number, number]>(this.fileEmbedding)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale((d as number[])[0]))
        .attr("cy", (d) => yScale((d as number[])[1]))
        .attr("r", DOT_RADIUS)
        .style("fill", "magenta")
        .on(
          "mouseenter",
          createShowPopperFunction(
            this.fileEmbedding,
            this.$refs.popperFile as HTMLDivElement
          )
        )
        .on("mouseout", () => {
          const popper = this.$refs.popperFile as HTMLDivElement;
          popper.hidden = true;
        });

      d3.select(svg)
        .append("g")
        .selectAll(".br.dot")
        .data<[number, number]>(this.bugReportEmbedding)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d[0]))
        .attr("cy", (d) => yScale(d[1]))
        .attr("r", DOT_RADIUS)
        .style("fill", "teal")
        .on(
          "mouseenter",
          createShowPopperFunction(
            this.bugReportEmbedding,
            this.$refs.popperBugReport as HTMLDivElement
          )
        )
        .on("mouseout", () => {
          const popper = this.$refs.popperBugReport as HTMLDivElement;
          popper.hidden = true;
        });
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

.popper {
  padding: 2px 5px;
  border-radius: 2px;

  &.br {
    background-color: #2c3e50;
    color: wheat;
  }

  &.file {
    background-color: darkmagenta;
    color: white;
  }
}
</style>
