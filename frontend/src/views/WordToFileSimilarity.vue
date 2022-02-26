<template>
  <div class="position-relative">
    <svg ref="svg" class="border border-info rounded"></svg>
  </div>
</template>

<script lang="ts">
import { computeSvgSize } from "@/components/bug-localization/utils";
import { State } from "@/store";
import * as d3 from "d3";
import { defineComponent } from "vue";
import { mapState } from "vuex";

export default defineComponent({
  name: "WordToFileSimilarity",
  computed: {
    ...mapState({
      bugWordToFileSimilarities: (state) =>
        (state as State).bugWordToFileSimilarities,
      bugReportTokens: (state) => (state as State).bugReportTokens,
    }),
    bugLocations(): string[] {
      return this.$store.state.bugLocations.map(([file]) => file);
    },
  },
  watch: {
    bugLocations() {
      this.drawBipartiteGraph();
    },
  },
  methods: {
    /**
     * @see: https://www.d3-graph-gallery.com/
     */
    drawBipartiteGraph() {
      const svgEl = this.$refs.svg as SVGElement;
      const size = computeSvgSize(svgEl);
      svgEl.style.height = `${size}px`;
      svgEl.style.width = `${size}px`;

      const svg = d3.select(svgEl);
      svg.selectChildren().remove();

      const rows = Object.entries(this.bugWordToFileSimilarities).flatMap(
        ([filename, similarities]) => {
          if (!this.bugLocations.includes(filename)) {
            return [];
          }
          return similarities.map((similarity, i) => {
            return {
              bugReportToken: this.bugReportTokens[i],
              filename,
              similarity,
            };
          });
        }
      );

      type Datum = typeof rows[number];

      const groups = ["Bug Report Word", "File"] as const;
      const maxBugReportTokenLength = Math.max(
        ...this.bugReportTokens.map((t) => t.length)
      );
      const xScale = d3
        .scalePoint()
        .domain(groups)
        .range([maxBugReportTokenLength * 8, size - 300]);

      const tokens = [this.bugReportTokens, this.bugLocations];
      const yScales = tokens.map((t) =>
        d3
          .scalePoint()
          .domain(t.reverse())
          .range([size - 15, 35])
      );

      const similarities = rows.map((row) => row.similarity);
      const edgeColorScale = d3
        .scaleLinear<string>()
        .domain([Math.min(...similarities), Math.max(...similarities)])
        .range(["seagreen", "darkred"]);

      type NullableNumber = number | undefined;
      const path = (d: Datum) => {
        return d3.line<[NullableNumber, NullableNumber]>()([
          [xScale(groups[0]), yScales[0](d.bugReportToken)],
          [xScale(groups[1]), yScales[1](d.filename)],
        ]);
      };

      const similarityTooltip = d3
        .select("body")
        .append("div")
        .attr("class", "px-2 py-1 rounded")
        .style("position", "absolute")
        .style("z-index", "1")
        .style("visibility", "hidden");

      svg
        .selectAll(".edge")
        .data<Datum>(rows)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", (d) => edgeColorScale(d.similarity))
        .style("stroke-width", "2px")
        .on("mouseover", (e, d) => {
          similarityTooltip
            .text(d.similarity.toFixed(3))
            .style("visibility", "visible")
            .style("background-color", edgeColorScale(d.similarity));
        })
        .on("mousemove", (e: MouseEvent) => {
          similarityTooltip
            .style("top", `${e.y - 10}px`)
            .style("left", `${e.x + 10}px`);
        })
        .on("mouseout", () => {
          similarityTooltip.style("visibility", "hidden");
        });

      const axes = svg
        .selectAll(".axis")
        .data(groups)
        .enter()
        .append("g")
        .attr("transform", (d) => "translate(" + xScale(d) + ")")
        .each(function (group, i) {
          const axisPlacement = i % 2 ? "axisRight" : "axisLeft";
          d3.select(this).call(d3[axisPlacement](yScales[i]));
        });

      axes
        .selectAll<SVGTextElement, string>("text")
        .style("font-size", "12px")
        .text((t: string) => {
          t = t.replaceAll("\\", "/");
          if (t.length < 50) {
            return t;
          }
          const parts = t.split("/");
          return (
            parts.slice(0, 3).join("/") + "/.../" + parts[parts.length - 1]
          );
        });

      // Add axis title
      axes
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", 16)
        .text((group) => group)
        .style("fill", "var(--bs-info)")
        .style("font-size", "16px");
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
