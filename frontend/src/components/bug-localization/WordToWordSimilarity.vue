<template>
  <div style="position: relative">
    <svg ref="svg" @fullscreenchange="onFullScreenChange"></svg>
    <div ref="popperBugReport" class="popper br" hidden></div>
    <div ref="popperFile" class="popper file" hidden></div>
    <button
      @click="makeFullScreen"
      ref="btnMax"
      class="btn btn-outline-dark max"
      title="Make the graph full screen"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-fullscreen"
        viewBox="0 0 16 16"
      >
        <path
          d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"
        />
      </svg>
    </button>
  </div>
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
    async makeFullScreen() {
      const svg = this.$refs.svg as SVGElement;
      await svg.requestFullscreen({ navigationUI: "show" });
    },
    onFullScreenChange() {
      this.drawSimilarity();
      (this.$refs.btnMax as HTMLButtonElement).hidden =
        !!document.fullscreenElement;
    },
    drawSimilarity() {
      const DOT_RADIUS = 3;

      const svg = this.$refs.svg as SVGElement;
      svg.style.height = `${svg.clientWidth}px`;

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
    this.drawSimilarity();
  },
});
</script>

<style lang="scss" scoped>
svg {
  width: 100%;

  &:fullscreen {
    background-color: white;
    width: 100vh;
    position: fixed;
    top: 0;
    z-index: 100;
  }
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

.btn.max {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
