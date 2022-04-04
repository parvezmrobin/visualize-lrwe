<template>
  <div class="mb-3 row align-items-center">
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

    <div
      v-show="!stack"
      class="col-auto"
      data-bs-toggle="tooltip"
      data-bs-placement="bottom"
      title="Show two asymmetric similarities for a file in opposite direction"
    >
      <div class="form-check form-check-inline form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          id="mirror"
          v-model="mirror"
        />
        <label class="form-check-label" for="mirror"> Mirror Bars </label>
      </div>
    </div>

    <div
      class="col-auto"
      data-bs-toggle="tooltip"
      data-bs-placement="bottom"
      title="Stack two asymmetric similarities on top of each other"
    >
      <div class="form-check form-check-inline form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          id="stack"
          v-model="stack"
        />
        <label class="form-check-label" for="stack"> Stack Bars </label>
      </div>
    </div>
  </div>

  <svg v-show="!stack" ref="svg" class="border border-info rounded"></svg>
  <svg v-show="stack" ref="stakedSvg" class="border border-info rounded">
    <g id="legend" ref="legend">
      <rect x="10" y="10" width="5" height="5" :fill="Colors.Vermilion" />
      <text x="20" y="18" :fill="Colors.Vermilion">File To Bug Similarity</text>
      <rect x="10" y="30" width="5" height="5" :fill="Colors.Blue" />
      <text x="20" y="38" :fill="Colors.Blue">Bug To File Similarity</text>
    </g>
  </svg>

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
  Colors,
  computeSvgSize,
  D3Selection,
  makeColorScale,
} from "@/utils";
import { Tooltip } from "bootstrap";
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
      mirror: true,
      stack: false,
      Colors,
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
    mirror() {
      this.drawSimilarity();
    },
    stack() {
      this.drawSimilarity();
    },
  },

  mounted(): void {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.forEach((tooltipTriggerEl) =>
      Tooltip.getOrCreateInstance(tooltipTriggerEl)
    );
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
        .domain([0, Math.max(...similarities)])
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
        .padding(0.6);
      return yScale;
    },
    _drawBars: function (
      d3Svg: D3Selection<SVGElement>,
      data: Datum[],
      yScale: d3.ScalePoint<string>,
      xScale: d3.ScaleLinear<number, number>,
      barColorScale: d3.ScaleLinear<string, string>,
      cls: string,
      orientation: "primary" | "secondary" | "only",
      right = false
    ): void {
      const bars = d3Svg.selectAll(`path.${cls}`).data(data);
      bars.exit().remove();
      bars.enter().append("path").attr("class", `bar ${cls}`);

      let height = yScale.bandwidth();
      if (orientation === "only") {
        height *= 2;
      }
      const curveRadius = height / 3;

      const getY = (d: Datum) => {
        const basePosition = yScale(d.filename) as number;
        const paddingOffset = yScale.padding() * (right ? 1 : -1);
        const bandwidthOffset =
          yScale.bandwidth() / (orientation === "secondary" ? 2 : -2);
        return basePosition + paddingOffset + bandwidthOffset;
      };

      const makePath = (d: Datum) => {
        const path = d3.path();
        let x = this.margin.x;
        let y = getY(d);
        path.moveTo(x, y);

        let width = xScale(d.similarity);
        if (width < curveRadius) {
          // prevent bar from going negative
          width = curveRadius;
        }

        x += width - curveRadius;
        path.lineTo(x, y);
        y += height;
        if (right) {
          path.lineTo(x, y);
        } else {
          path.bezierCurveTo(
            x + curveRadius * 1.25,
            y - height / 10,
            x + curveRadius * 1.25,
            y - (height * 9) / 10,
            x,
            y
          );
        }
        x -= width - curveRadius;
        path.lineTo(x, y);
        y -= height;
        if (right) {
          path.bezierCurveTo(
            x - curveRadius * 1.25,
            y + height / 10,
            x - curveRadius * 1.25,
            y + (height * 9) / 10,
            x,
            y
          );
        } else {
          path.closePath();
        }

        return path.toString();
      };

      const rectangles = d3Svg
        .selectAll<SVGRectElement, Datum>(`path.bar.${cls}`)
        .transition()
        .attr("d", makePath)
        .style("fill", (d) => barColorScale(d.similarity));

      if (right) {
        const range = xScale.range()[1] - xScale.range()[0];
        rectangles.style("transform", (d) => {
          const width = xScale(d.similarity);
          let translateX = curveRadius + range - width;
          if (width < curveRadius) {
            translateX += width - curveRadius;
          }
          return `translate(${translateX}px, 0)`;
        });
      } else {
        rectangles.style("transform", "none");
      }
    },
    _drawAxis: function (
      d3Svg: D3Selection<SVGElement>,
      yScale: d3.ScalePoint<string>,
      cls?: string,
      right = false,
      xRange = 0
    ): void {
      let yAxis: D3Selection<SVGGElement> = d3Svg.select(
        `.axis${cls ? `.${cls}` : ""}`
      );
      const getFilenameFromDatum = (d: string) => {
        return d.replaceAll("\\", "/").split("/").slice(-1)[0];
      };
      if (yAxis.empty()) {
        yAxis = d3Svg
          .append("g")
          .attr("class", `axis${cls ? ` ${cls}` : ""}`)
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
          .selectAll<SVGTextElement, string>("line+text")
          .attr("class", "filename")
          .text(getFilenameFromDatum);
      }

      addFilenameHoverSupport(yAxis, this.$refs.tooltip);

      if (!cls) {
        return;
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

      if (this.mirror) {
        title.attr("x", 0).text(cls.replaceAll("-", " "));
      } else {
        const titleWords = cls.split("-");
        title
          .attr("x", this.margin.x)
          .text(
            `${titleWords.join(" ")} followed by ${titleWords
              .reverse()
              .join(" ")}`
          );
      }
    },
    _drawPairedSimilarity() {
      const d3Svg = d3.select(this.$refs.svg as SVGElement);
      const size = computeSvgSize(d3Svg.node() as SVGElement);
      d3Svg.style("height", `${size}px`).style("width", `${size}px`);

      const yScale = this._makeYScale(size, this.fileToBugSimilarity);

      const xScale = this._makeXScale(size, [
        ...this.fileToBugSimilarity,
        ...this.bugToFileSimilarity,
      ]);
      const colorScale = this._makeColorScale(size, [
        ...this.fileToBugSimilarity,
        ...this.bugToFileSimilarity,
      ]);

      this._drawBars(
        d3Svg,
        this.fileToBugSimilarity,
        yScale,
        xScale,
        colorScale,
        "file-to-bug",
        "primary"
      );
      this._drawAxis(d3Svg, yScale, "file-to-bug");

      this._drawBars(
        d3Svg,
        this.bugToFileSimilarity,
        yScale,
        xScale,
        colorScale,
        "bug-to-file",
        "secondary",
        this.mirror
      );
      if (this.mirror) {
        this._drawAxis(
          d3Svg,
          yScale,
          "bug-to-file",
          true,
          xScale.range()[1] - xScale.range()[0]
        );
      } else {
        d3Svg.select(".axis.bug-to-file").remove();
      }
    },
    _drawStackedSimilarity() {
      const d3Svg = d3.select(this.$refs.stakedSvg as SVGElement);
      const size = computeSvgSize(d3Svg.node() as SVGElement);
      d3Svg.style("height", `${size}px`).style("width", `${size}px`);

      d3.select(this.$refs.legend as SVGGElement).attr(
        "transform",
        `translate(${size - 175}, ${size - 50})`
      );

      const yScale = this._makeYScale(size, this.fileToBugSimilarity);

      const joinedSimilarity: Datum[] = this.fileToBugSimilarity.map(
        ({ filename, similarity }, i) => ({
          filename,
          similarity: similarity + this.bugToFileSimilarity[i].similarity,
        })
      );
      const xScale = this._makeXScale(size, joinedSimilarity);
      const vermilionScale = d3
        .scaleLinear<string>()
        .range([Colors.Vermilion, Colors.Vermilion]);
      const blueScale = d3
        .scaleLinear<string>()
        .range([Colors.Blue, Colors.Blue]);

      this._drawBars(
        d3Svg,
        joinedSimilarity,
        yScale,
        xScale,
        vermilionScale,
        "file-to-bug",
        "only"
      );
      this._drawBars(
        d3Svg,
        this.bugToFileSimilarity,
        yScale,
        xScale,
        blueScale,
        "bug-to-file",
        "only"
      );
      this._drawAxis(d3Svg, yScale);
    },
    drawSimilarity() {
      if (this.stack) {
        this._drawStackedSimilarity();
      } else {
        this._drawPairedSimilarity();
      }
    },
  },
});
</script>

<style scoped lang="scss"></style>
