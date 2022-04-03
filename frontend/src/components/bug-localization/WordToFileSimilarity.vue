<template>
  <div class="mb-3 row">
    <label for="num-file" class="col-auto col-form-label">
      Number of Files to Show
    </label>
    <div class="col-sm-2">
      <input
        type="number"
        v-model.number="numFile"
        name="num-file"
        id="num-file"
        class="form-control"
      />
    </div>

    <label for="num-edge" class="col-auto col-form-label">
      Number of Edges to Show
    </label>
    <div class="col-sm-2">
      <input
        type="number"
        v-model.number="numEdge"
        name="num-edge"
        id="num-edge"
        class="form-control"
      />
    </div>
  </div>

  <div class="position-relative" v-once>
    <svg ref="svg" class="border border-info rounded"></svg>
  </div>

  <div
    v-once
    ref="tooltip"
    class="px-2 py-1 rounded shadow position-fixed"
    style="visibility: hidden; z-index: 1"
  />
</template>

<script lang="ts">
import { State } from "@/store";
import {
  computeSvgSize,
  D3Selection,
  formatFileTick,
  makeColorScale,
  makeTooltipUtils,
} from "@/utils";
import * as d3 from "d3";
import { defineComponent } from "vue";
import { mapState } from "vuex";

type Datum = { filename: string; similarity: number; bugReportToken: string };

export default defineComponent({
  name: "WordToFileSimilarity",
  data() {
    return {
      numFile: 10,
      numEdge: 50,
    };
  },
  computed: {
    ...mapState({
      bugWordToFileSimilarities: (state) =>
        (state as State).similarity?.bugWordToFileSimilarities,
      bugReportTokens: (state) => (state as State).similarity?.bugReportTokens,
    }),
    /**
     * Implementing as a computed property to avoid repeated d3.Selection creation
     * @returns {Selection<SVGElement, unknown, null, undefined>}
     */
    d3Svg() {
      const svgEl = this.$refs.svg as SVGElement;
      return d3.select(svgEl);
    },
  },
  watch: {
    bugReportTokens() {
      this.drawBipartiteGraph();
    },
    numEdge() {
      this.validateNumbersAndDrawBipartiteGraph();
    },
    numFile() {
      this.validateNumbersAndDrawBipartiteGraph();
    },
  },
  methods: {
    validateNumbersAndDrawBipartiteGraph() {
      if (!this.bugReportTokens) {
        return;
      }
      if (this.numFile < 1) {
        this.numFile = 1;
      }
      if (this.numEdge <= 1) {
        this.numEdge = 1;
      }
      if (this.numEdge > this.numFile * this.bugReportTokens.length) {
        // this is the maximum possible number of edges
        this.numEdge = this.numFile * this.bugReportTokens.length;
      }
      this.drawBipartiteGraph();
    },
    /**
     * @see: https://www.d3-graph-gallery.com/
     */
    drawBipartiteGraph() {
      if (!this.bugWordToFileSimilarities || !this.bugReportTokens) {
        return;
      }
      const size = computeSvgSize(this.d3Svg.node() as SVGElement);
      this.d3Svg.style("height", `${size}px`).style("width", `${size}px`);

      const bugLocations = Object.entries(this.bugWordToFileSimilarities).slice(
        0,
        this.numFile
      );

      const bugReportTokens = this.bugReportTokens;
      const rows = bugLocations
        .flatMap(([filename, similarities]) => {
          return similarities.map((similarity, i) => {
            return {
              bugReportToken: bugReportTokens[i],
              filename,
              similarity,
            };
          });
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, this.numEdge);

      const groups = ["Bug Report Word", "File"] as const;
      const maxBugReportTokenLength = Math.max(
        ...bugReportTokens.map((t) => t.length)
      );
      const xScale = d3
        .scalePoint()
        .domain(groups)
        .range([maxBugReportTokenLength * 8, size - 300]);

      const yScales = [bugReportTokens, rows.map((row) => row.filename)].map(
        (tokens) =>
          d3
            .scalePoint()
            .domain(tokens.sort())
            .range([size - 15, 35])
      );

      const similarities = rows.map((row) => row.similarity);
      const edgeColorScale = makeColorScale([
        Math.min(...similarities),
        Math.max(...similarities),
      ]);

      type NullableNumber = number | undefined;
      const lineFactory = d3
        .line<[NullableNumber, NullableNumber]>()
        .curve(d3.curveBumpX);
      const path = (d: Datum) => {
        return lineFactory([
          [xScale(groups[0]), yScales[0](d.bugReportToken)],
          [xScale(groups[1]), yScales[1](d.filename)],
        ]);
      };
      const { tooltip, hideTooltip, moveTooltip } = makeTooltipUtils(
        this.$refs.tooltip
      );

      const edges = this.d3Svg.selectAll("path.edge").data(rows);
      edges.exit().remove();
      edges
        .enter()
        .append("path")
        .attr("class", "edge")
        .on("mouseover", (e, d) => {
          const path = e.currentTarget as SVGPathElement;
          path.style.stroke = "black";
          const similarity = d.similarity.toFixed(3);
          const edgeInfo = `<span class="text-white">Similarity of ‘${
            d.bugReportToken
          }’ and <code class="text-white">${
            d.filename.split(/[\\/]/).slice(-1)[0]
          }</code> is ${similarity}</span>`;
          tooltip
            .html(edgeInfo)
            .style("visibility", "visible")
            .style("background-color", edgeColorScale(d.similarity));
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", (e, d) => {
          const path = e.currentTarget as SVGPathElement;
          path.style.stroke = edgeColorScale(d.similarity);
          hideTooltip();
        });

      this.d3Svg
        .selectAll<SVGPathElement, Datum>("path.edge")
        .transition()
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", (d) => edgeColorScale(d.similarity))
        .style("stroke-width", "2px");

      let axes: D3Selection<SVGGElement, string> = d3.selectAll("g.axis");

      if (axes.empty()) {
        axes = this.d3Svg
          .selectAll("g.axis")
          .data<string>(groups)
          .enter()
          .append("g")
          .attr("class", "axis")
          .attr("transform", (d) => `translate(${xScale(d)})`)
          .each(function (group, i) {
            const axisPlacement = i % 2 ? "axisRight" : "axisLeft";
            return d3.select(this).call(d3[axisPlacement](yScales[i]));
          });

        // Add axis title
        axes
          .append("text")
          .style("text-anchor", "middle")
          .attr("y", 16)
          .text((group) => group)
          .style("fill", "var(--bs-info)")
          .style("font-size", "16px");
      } else {
        // @see: https://bl.ocks.org/guilhermesimoes/15ed216d14175d8165e6
        axes
          .attr("transform", (d) => `translate(${xScale(d)})`)
          .each(function (group, i) {
            const axisPlacement = i % 2 ? "axisRight" : "axisLeft";
            d3.select(this)
              .transition()
              .call(d3[axisPlacement](yScales[i]))
              .selectAll<SVGTextElement, string>("line+text")
              .style("font-size", "12px")
              .text(formatFileTick);
          });
      }

      axes
        .selectAll<SVGTextElement, string>("line+text")
        .style("font-size", "12px")
        .text(formatFileTick)
        .on("mouseover", (e, d) => {
          tooltip
            .html(`<code class="text-info">${d}</code>`)
            .style("visibility", "visible")
            .style("background-color", "var(--bs-dark)");
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
    },
  },
  mounted(): void {
    this.drawBipartiteGraph();
  },
});
</script>

<style scoped lang="scss">
svg {
  width: 100%;

  &:fullscreen {
    background-color: white;
    width: 100vh !important;
    position: fixed;
    top: 0;
    z-index: 100;
  }
}
</style>
