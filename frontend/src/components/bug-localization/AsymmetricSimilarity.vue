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

export default defineComponent({
  name: "AsymmetricSimilarity",

  computed: {
    fileToBugSimilarity(): Datum[] {
      if (!this.$store.state.similarity) {
        return [];
      }
      const { fileToBugReportSimilarity } = this.$store.state.similarity;
      return Object.entries(fileToBugReportSimilarity)
        .slice(0, 30)
        .map(([filename, similarity]) => ({
          filename,
          similarity,
        }));
    },
    bugToFileSimilarity(): Datum[] {
      if (!this.$store.state.similarity) {
        return [];
      }

      const { bugReportToFileSimilarity } = this.$store.state.similarity;
      return Object.entries(bugReportToFileSimilarity)
        .slice(0, 30)
        .map(([filename, similarity]) => ({
          filename,
          similarity,
        }));
    },

    margin() {
      return {
        x: 150,
        top: 35,
        bottom: 10,
      };
    },
  },

  watch: {
    "$store.state.similarity"() {
      this.drawSimilarity();
    },
  },

  mounted(): void {
    this.drawSimilarity();
  },

  methods: {
    _makeYScale: function (
      size: number,
      similarityObject: Datum[]
    ): d3.ScalePoint<string> {
      const filenames = similarityObject.map(({ filename }) => filename);
      const fileToBugScale = d3
        .scaleBand()
        .domain(filenames)
        .range([this.margin.top, size - this.margin.bottom])
        .padding(0.55);
      return fileToBugScale;
    },
    _drawBars: function (
      d3Svg: D3Selection<SVGElement>,
      yScale: d3.ScalePoint<string>,
      xScale: d3.ScaleLinear<number, number>,
      barColorScale: d3.ScaleLinear<string, number>,
      cls: string,
      right = false
    ): void {
      const fileToBugBars = d3Svg
        .selectAll(`rect.${cls}`)
        .data(this.fileToBugSimilarity);
      fileToBugBars.exit().remove();
      fileToBugBars.enter().append("rect").attr("class", `bar ${cls}`);
      const rectangles = d3Svg
        .selectAll<SVGRectElement, Datum>(`rect.bar.${cls}`)
        .transition()
        .attr("x", this.margin.x)
        .attr("y", (d) => {
          const basePosition = yScale(d.filename) as number;
          return (
            basePosition +
            yScale.padding() * (right ? 1 : -1) +
            yScale.bandwidth() / (right ? 2 : -2)
          );
        })
        .attr("width", (d) => xScale(d.similarity))
        .attr("height", yScale.bandwidth)
        .attr("rx", 2)
        .attr("ry", 1)
        .style("fill", (d) => barColorScale(d.similarity));

      if (right) {
        const range = xScale.range()[1] - xScale.range()[0];
        rectangles.style(
          "transform",
          (d) =>
            `translate(${this.margin.x + range - xScale(d.similarity)}px, 0)`
        );
      }
    },
    _drawAxis: function (
      d3Svg: D3Selection<SVGElement>,
      yScale: d3.ScalePoint<string>,
      cls: string,
      right = false,
      xRange = 0
    ): void {
      let yAxis: D3Selection<SVGGElement> = d3Svg.select(`.axis.${cls}`);
      const getFilenameFromDatum = (d: string) => {
        return d.replaceAll("\\", "/").split("/").slice(-1)[0];
      };
      if (yAxis.empty()) {
        yAxis = d3Svg
          .append("g")
          .attr("class", `axis ${cls}`)
          .attr(
            "transform",
            `translate(${
              this.margin.x + (right ? xRange + this.margin.x : 0)
            }, 0)`
          )
          .call(d3[right ? "axisRight" : "axisLeft"](yScale).tickSizeOuter(0));
        yAxis
          .selectAll<SVGTextElement, string>("text")
          .text(getFilenameFromDatum);
      } else {
        yAxis
          .transition()
          .call(d3[right ? "axisRight" : "axisLeft"](yScale).tickSizeOuter(0))
          .selectAll<SVGTextElement, string>("text")
          .text(getFilenameFromDatum);
      }

      let title = yAxis.select<SVGTextElement>("text.title");
      if (title.empty()) {
        title = yAxis
          .append<SVGTextElement>("text")
          .attr("class", "title")
          .attr("y", 20)
          .style("font-size", "16px")
          .style("text-transform", "capitalize")
          .style("fill", "black");
      }

      title.text(cls.replaceAll("-", " "));
    },
    drawSimilarity() {
      const d3Svg = d3.select(this.$refs.svg as SVGElement);
      const size = computeSvgSize(d3Svg.node() as SVGElement);
      d3Svg.style("height", `${size}px`).style("width", `${size}px`);

      const fileToBugScale = this._makeYScale(size, this.fileToBugSimilarity);
      const bugToFileScale = this._makeYScale(size, this.bugToFileSimilarity);

      const allSimilarity = [
        ...this.fileToBugSimilarity.map(({ similarity }) => similarity),
        ...this.bugToFileSimilarity.map(({ similarity }) => similarity),
      ];
      const similarityDomain = [
        Math.min(...allSimilarity),
        Math.max(...allSimilarity),
      ];
      const xScale = d3
        .scaleLinear()
        .domain(similarityDomain)
        .range([this.margin.x, size - 2 * this.margin.x]);
      const barColorScale = d3
        .scaleLinear<string, number>()
        .domain(similarityDomain)
        .range(["lightseagreen", "#aa1123"]);

      this._drawBars(
        d3Svg,
        fileToBugScale,
        xScale,
        barColorScale,
        "file-to-bug"
      );
      this._drawBars(
        d3Svg,
        bugToFileScale,
        xScale,
        barColorScale,
        "bug-to-file",
        true
      );
      this._drawAxis(d3Svg, fileToBugScale, "file-to-bug");
      this._drawAxis(
        d3Svg,
        bugToFileScale,
        "bug-to-file",
        true,
        xScale.range()[1] - xScale.range()[0]
      );
    },
  },
});
</script>

<style scoped lang="scss"></style>
