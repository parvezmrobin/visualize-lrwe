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
  </div>

  <svg class="border border-info rounded" ref="svg"></svg>

  <div
    v-once
    ref="tooltip"
    class="px-2 py-1 rounded shadow position-fixed"
    style="visibility: hidden; z-index: 1"
  />
</template>

<script lang="ts">
import {
  addFilenameHoverSupport,
  computeSvgSize,
  D3Selection,
  makeColorScale,
} from "@/utils";
import * as d3 from "d3";
import { defineComponent } from "vue";

type Datum = {
  filename: string;
  similarity: number;
};

export default defineComponent({
  name: "AsymmetricSimilarity",

  data() {
    return {
      numFile: 30,
    };
  },

  computed: {
    fileToBugSimilarity(): Datum[] {
      if (!this.$store.state.similarity) {
        return [];
      }
      const { fileToBugReportSimilarity } = this.$store.state.similarity;
      return Object.entries(fileToBugReportSimilarity)
        .slice(0, this.numFile)
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
        .slice(0, this.numFile)
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
    numFile() {
      this.drawSimilarity();
    },
  },

  mounted(): void {
    this.drawSimilarity();
  },

  methods: {
    _makeXScale: function (
      size: number,
      similarityObject: Datum[]
    ): d3.ScaleLinear<number, number> {
      const similarities = similarityObject.map(({ similarity }) => similarity);
      return d3
        .scaleLinear()
        .domain([Math.min(...similarities), Math.max(...similarities)])
        .range([0, size - 2 * this.margin.x]);
    },
    _makeColorScale: function (
      size: number,
      similarityObject: Datum[]
    ): d3.ScaleLinear<string, string> {
      const similarities = similarityObject.map(({ similarity }) => similarity);
      return makeColorScale([
        Math.min(...similarities),
        Math.max(...similarities),
      ]);
    },
    _makeYScale: function (
      size: number,
      similarityObject: Datum[]
    ): d3.ScalePoint<string> {
      const filenames = similarityObject.map(({ filename }) => filename);
      const yScale = d3
        .scaleBand()
        .domain(filenames)
        .range([this.margin.top, size - this.margin.bottom])
        .padding(0.55);
      return yScale;
    },
    _drawBars: function (
      d3Svg: D3Selection<SVGElement>,
      data: Datum[],
      yScale: d3.ScalePoint<string>,
      xScale: d3.ScaleLinear<number, number>,
      barColorScale: d3.ScaleLinear<string, string>,
      cls: string,
      right = false
    ): void {
      const fileToBugBars = d3Svg.selectAll(`rect.${cls}`).data(data);
      fileToBugBars.exit().remove();
      fileToBugBars.enter().append("rect").attr("class", `bar ${cls}`);
      const rectangles = d3Svg
        .selectAll<SVGRectElement, Datum>(`rect.bar.${cls}`)
        .transition()
        .attr("x", right ? 0 : this.margin.x)
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
            `translate(${this.margin.x + (right ? xRange : 0)}, 0)`
          )
          .call(d3[right ? "axisRight" : "axisLeft"](yScale).tickSizeOuter(0));
        yAxis
          .selectAll<SVGTextElement, string>("text")
          .attr("class", "filename")
          .text(getFilenameFromDatum);
      } else {
        yAxis
          .transition()
          .call(d3[right ? "axisRight" : "axisLeft"](yScale).tickSizeOuter(0))
          .selectAll<SVGTextElement, string>("text.filename")
          .text(getFilenameFromDatum);
      }

      addFilenameHoverSupport(yAxis, this.$refs.tooltip);

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

      const fileToBugYScale = this._makeYScale(size, this.fileToBugSimilarity);
      const bugToFileYScale = this._makeYScale(size, this.bugToFileSimilarity);

      const fileToBugXScale = this._makeXScale(size, this.fileToBugSimilarity);
      const bugToFileXScale = this._makeXScale(size, this.bugToFileSimilarity);
      const fileToBugColorScale = this._makeColorScale(
        size,
        this.fileToBugSimilarity
      );
      const bugToFileColorScale = this._makeColorScale(
        size,
        this.bugToFileSimilarity
      );

      this._drawBars(
        d3Svg,
        this.fileToBugSimilarity,
        fileToBugYScale,
        fileToBugXScale,
        fileToBugColorScale,
        "file-to-bug"
      );
      this._drawBars(
        d3Svg,
        this.bugToFileSimilarity,
        bugToFileYScale,
        bugToFileXScale,
        bugToFileColorScale,
        "bug-to-file",
        true
      );
      this._drawAxis(d3Svg, fileToBugYScale, "file-to-bug");
      this._drawAxis(
        d3Svg,
        bugToFileYScale,
        "bug-to-file",
        true,
        fileToBugXScale.range()[1] - fileToBugXScale.range()[0]
      );
    },
  },
});
</script>

<style scoped lang="scss"></style>
