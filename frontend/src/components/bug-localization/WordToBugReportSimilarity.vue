<template>
  <div class="mb-3 row" v-show="filenames.length">
    <SelectFile :file-color="fileColor" col-class="col-sm-4" />

    <label for="num-words" class="col-auto col-form-label">
      Number of Words
    </label>
    <div class="col-sm-2">
      <input
        type="number"
        v-model.number="numWords"
        name="num-words"
        id="num-words"
        class="form-control"
        min="2"
      />
    </div>
  </div>

  <div v-show="selectedFile" style="position: relative">
    <svg class="border border-info rounded" ref="svg">
      <Legend ref="legend" />
    </svg>
  </div>
</template>

<script lang="ts">
import Legend from "@/components/bug-localization/Legend.vue";
import SelectFile from "@/components/bug-localization/SelectFile.vue";
import { computeSvgSize, D3Selection, makeColorScale } from "@/utils";
import * as d3 from "d3";
import { ComponentPublicInstance, defineComponent, PropType } from "vue";
import { mapGetters, mapState } from "vuex";

export default defineComponent({
  name: "WordToBugReportSimilarity",
  components: { Legend, SelectFile },
  props: {
    fileColor: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
  },
  data() {
    return {
      numWords: 30,
    };
  },
  computed: {
    ...mapState(["selectedFile"]),
    ...mapGetters(["filenames"]),
    fileWordToBugSimilarities() {
      return this.$store.state.similarity?.fileWordToBugSimilarity[
        this.selectedFile
      ].slice(0, this.numWords);
    },
    fileWords() {
      return this.$store.state.similarity?.fileTokens[this.selectedFile].slice(
        0,
        this.numWords
      );
    },
  },
  watch: {
    async selectedFile() {
      await this.$nextTick();
      this.drawSimilarity();
    },
    async numWords() {
      await this.$nextTick();
      this.drawSimilarity();
    },
  },
  mounted(): void {
    this.drawSimilarity();
  },
  methods: {
    drawSimilarity() {
      if (
        !this.selectedFile ||
        !this.fileWordToBugSimilarities ||
        !this.fileWords
      ) {
        return;
      }

      const d3Svg = d3.select(this.$refs.svg as SVGElement);
      const size = computeSvgSize(d3Svg.node() as SVGElement);
      d3Svg.style("height", `${size}px`).style("width", `${size}px`);

      (
        this.$refs.legend as ComponentPublicInstance<typeof Legend>
      ).adjustPosition(size - 100, size - 50);

      const margin = {
        left: 100,
        right: 10,
        top: 10,
        bottom: 10,
      };

      const similarityDomain = [
        Math.min(...this.fileWordToBugSimilarities),
        Math.max(...this.fileWordToBugSimilarities),
      ] as const;
      const xScale = d3
        .scaleLinear()
        .domain(similarityDomain)
        .range([margin.left, size - margin.left - margin.right]);

      const yScale = d3
        .scaleBand()
        .domain(this.fileWords)
        .range([margin.top, size - margin.bottom])
        .padding(1 / this.fileWords.length + 0.1);

      const barColorScale = makeColorScale(similarityDomain);

      type Datum = {
        word: string;
        similarity: number;
      };
      const data: Datum[] = this.fileWordToBugSimilarities.map(
        (similarity, i) => ({
          word: (this.fileWords as string[])[i],
          similarity,
        })
      );
      const bars = d3Svg.selectAll("rect.bar").data(data);
      bars.exit().remove();
      bars.enter().append("rect").attr("class", "bar");

      d3Svg
        .selectAll<SVGRectElement, Datum>("rect.bar")
        .transition()
        .attr("x", margin.left)
        .attr("y", (d) => yScale(d.word) as number)
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

      axis.selectAll("text").style("font-size", "12px");
    },
  },
});
</script>
