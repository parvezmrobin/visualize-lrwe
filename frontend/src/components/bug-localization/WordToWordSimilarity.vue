<template>
  <div class="mb-3 row" v-show="filenames.length">
    <SelectFile :file-color="fileColor" />

    <div class="col-sm-3 col-lg-4 d-flex align-items-center">
      <div class="form-check form-check-inline">
        <input
          class="form-check-input"
          type="radio"
          id="pca"
          value="pca"
          v-model="dimension"
        />
        <label class="form-check-label" for="pca">PCA</label>
      </div>
      <div class="form-check form-check-inline">
        <input
          class="form-check-input"
          type="radio"
          id="tsne"
          value="tsne"
          v-model="dimension"
        />
        <label class="form-check-label" for="tsne">t-SNE</label>
      </div>
    </div>
  </div>

  <!--  Using relative position to position maximize icon properly-->
  <div v-show="selectedFile" style="position: relative">
    <svg class="border border-info rounded" ref="svg">
      <g id="legend">
        <rect x="10" y="10" width="5" height="5" fill="cyan" />
        <text x="20" y="18" fill="cyan">Bug Report</text>
        <rect x="10" y="30" width="5" height="5" fill="magenta" />
        <text x="20" y="38" fill="magenta">Selected File</text>
      </g>
      <line
        v-if="edgeFrom && edgeTo"
        :x1="edgeFrom[0]"
        :y1="edgeFrom[1]"
        :x2="edgeTo[0]"
        :y2="edgeTo[1]"
        stroke-width="2px"
        stroke="lightseagreen"
      />
    </svg>
    <div ref="popperBugReport" class="popper br" hidden></div>
    <div ref="popperFile" class="popper file" hidden></div>
    <div ref="popperSimilarity" class="popper similarity" hidden></div>
  </div>
</template>

<script lang="ts">
import SelectFile from "@/components/bug-localization/SelectFile.vue";
import { SimilarityPayload, TSNEPayload } from "@/store";
import { computeSvgSize, D3Selection } from "@/utils";
import { createPopper } from "@popperjs/core";
import axios from "axios";
import * as d3 from "d3";
import { defineComponent, PropType } from "vue";
import { mapGetters, mapState } from "vuex";

type ShowPopper = (e: MouseEvent, point: [number, number]) => void;
const DOT_RADIUS = 3;
const CIRCLE_RADIUS = 8;

export default defineComponent({
  name: "WordToWordSimilarity",
  components: { SelectFile },
  props: {
    fileColor: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
  },

  data() {
    return {
      dimension: "pca",
      edgeFrom: null as null | readonly [number, number],
      edgeFromWord: "",
      edgeFromIndex: -1,
      edgeFromType: "",
      edgeFromElement: null as null | SVGCircleElement,
      edgeTo: null as null | readonly [number, number],
      edgeToWord: "",
      edgeToIndex: -1,
    };
  },

  computed: {
    ...mapState(["selectedBug", "selectedFile", "similarity", "tSNE"]),
    ...mapGetters(["filenames"]),
    wordToWordSimilarities(): number[][] {
      return this.similarity.wordToWordSimilarities[this.selectedFile];
    },
  },

  watch: {
    selectedBug() {
      this.dimension = "pca";
    },
    edgeTo() {
      const popper = this.$refs.popperSimilarity as HTMLDivElement;
      if (this.edgeFrom && this.edgeTo) {
        let fileWordIndex: number, bugWordIndex: number;
        if (this.edgeFromType === "fileEmbedding") {
          [fileWordIndex, bugWordIndex] = [
            this.edgeToIndex,
            this.edgeFromIndex,
          ];
        } else if (this.edgeFromType === "bugReportEmbedding") {
          [fileWordIndex, bugWordIndex] = [
            this.edgeFromIndex,
            this.edgeToIndex,
          ];
        } else {
          throw new Error(`Invalid edgeFromType "${this.edgeFromType}"`);
        }
        popper.hidden = false;
        const similarity =
          this.wordToWordSimilarities[fileWordIndex][bugWordIndex];
        popper.innerText = `similarity of ‘${this.edgeFromWord}’ and ‘${
          this.edgeToWord
        }’ is ${similarity.toFixed(2)}`;

        createPopper(this.edgeFromElement as SVGCircleElement, popper, {
          placement: this.edgeFrom[0] > this.edgeTo[0] ? "right" : "left",
        });
      } else {
        popper.hidden = true;
      }
    },
    async selectedFile() {
      this.edgeFrom = null;
      await this.$nextTick(); // let the svg to show
      this.drawSimilarity();
    },
    async dimension() {
      if (this.dimension === "tsne" && !this.tSNE) {
        this.$store.state.isLoading = true;
        const similarity = this.similarity as SimilarityPayload | undefined;
        const resp = await axios.post<TSNEPayload>(
          `/bug/${this.selectedBug}/tsne`,
          similarity?.topWordIndices
        );
        await this.$store.dispatch("updateTSNEData", resp.data);
        this.$store.state.isLoading = false;
      }

      this.drawSimilarity();
    },
  },

  methods: {
    drawSimilarity() {
      if (!this.similarity || !this.selectedFile) {
        return;
      }
      const margin = {
        left: 5,
        right: 5,
        top: 5,
        bottom: 5,
      };

      const svg = this.$refs.svg as SVGElement;
      const size = computeSvgSize(svg);
      svg.style.height = `${size}px`;
      svg.style.width = `${size}px`;

      const d3Svg = d3.select(svg);

      let fileEmbedding: [number, number][];
      let bugReportEmbedding: [number, number][];
      if (this.dimension === "pca") {
        fileEmbedding = this.similarity.fileEmbeddingsPCA[this.selectedFile];
        bugReportEmbedding = this.similarity.bugReportEmbeddingPCA;
      } else {
        fileEmbedding = this.tSNE.fileEmbeddingsTSNE[this.selectedFile];
        bugReportEmbedding = this.tSNE.bugReportEmbeddingTSNE;
      }
      const xValues = [fileEmbedding, bugReportEmbedding].flatMap((embedding) =>
        embedding.map(([x]) => x)
      );
      const yValues = [fileEmbedding, bugReportEmbedding].flatMap((embedding) =>
        embedding.map(([, y]) => y)
      );

      const xScale = d3
        .scaleLinear()
        .domain([Math.min(...xValues), Math.max(...xValues)])
        .range([
          DOT_RADIUS + margin.left,
          svg.clientWidth - DOT_RADIUS - margin.right,
        ]);

      const yScale = d3
        .scaleLinear()
        .domain([Math.min(...yValues), Math.max(...yValues)])
        .range([
          svg.clientWidth - DOT_RADIUS - margin.bottom,
          DOT_RADIUS + margin.top,
        ]);

      const embeddings = {
        bugReportEmbedding: [
          bugReportEmbedding,
          this.similarity.bugReportTokens,
          "cyan",
        ] as const,
        fileEmbedding: [
          fileEmbedding,
          this.similarity.fileTokens[this.selectedFile],
          "magenta",
        ] as const,
      };

      for (const key in embeddings) {
        const [embedding, tokens, color] =
          embeddings[key as keyof typeof embeddings];
        this.ensureEmbeddingPlate(
          d3Svg,
          key,
          embedding,
          tokens,
          xScale,
          yScale,
          color
        );
      }
    },

    ensureEmbeddingPlate(
      svg: D3Selection<SVGElement>,
      key: string,
      embedding: [number, number][],
      tokens: string[],
      xScale: d3.ScaleLinear<number, number>,
      yScale: d3.ScaleLinear<number, number>,
      color: string
    ) {
      let group: D3Selection<SVGGElement> = svg.select(`g.plate.${key}`);
      if (group.empty()) {
        group = svg.append("g").attr("class", `plate ${key}`);
      }

      const circlesWithData = svg
        .selectAll(`.${key}.circle`)
        .data<[number, number]>(embedding);
      circlesWithData.exit().remove();
      circlesWithData.enter().append("circle").attr("class", `${key} circle`);

      const pointsWithData = svg
        .selectAll(`.${key}.dot`)
        .data<[number, number]>(embedding);
      pointsWithData.exit().remove();
      pointsWithData.enter().append("circle").attr("class", `${key} dot`);

      const getCenterFromEvent = (e: MouseEvent): readonly [number, number] => {
        const attributes = (e.target as SVGCircleElement).attributes;
        const edgeFrom = [
          Number.parseFloat(attributes.getNamedItem("cx")?.value as string),
          Number.parseFloat(attributes.getNamedItem("cy")?.value as string),
        ] as const;
        return edgeFrom;
      };

      // now take all points (existing + appended) and set/update position
      const edgeStartListener = (e: MouseEvent, point: [number, number]) => {
        this.edgeFrom = getCenterFromEvent(e);
        this.edgeFromIndex = embedding.indexOf(point);
        this.edgeFromWord = tokens[this.edgeFromIndex];
        this.edgeFromType = key;
        this.edgeFromElement = e.target as SVGCircleElement;
      };

      const edgeEndListener = (e: MouseEvent, point: [number, number]) => {
        if (!this.edgeFrom || this.edgeFromType === key) {
          return;
        }
        this.edgeTo = getCenterFromEvent(e);
        this.edgeToIndex = embedding.indexOf(point);
        this.edgeToWord = tokens[this.edgeToIndex];
      };

      svg
        .selectAll<SVGCircleElement, [number, number]>(`circle.${key}.dot`)
        .on(
          "mouseenter",
          this.createShowPopperFunction(
            embedding,
            this.$refs.popperFile as HTMLDivElement,
            tokens,
            edgeEndListener
          )
        )
        .on("mouseout", () => {
          const popper = this.$refs.popperFile as HTMLDivElement;
          popper.hidden = true;
        })
        .on("click", edgeStartListener)
        .transition()
        .attr("cx", (d) => xScale(d[0]))
        .attr("cy", (d) => yScale(d[1]))
        .attr("r", DOT_RADIUS)
        .style("fill", color);

      svg
        .selectAll<SVGCircleElement, [number, number]>(`circle.${key}.circle`)
        .attr("cx", (d) => xScale(d[0]))
        .attr("cy", (d) => yScale(d[1]))
        .attr("r", CIRCLE_RADIUS)
        .style("fill", "transparent")
        .on("click", edgeStartListener)
        .on("mouseenter", edgeEndListener)
        .on("mouseout", () => {
          this.edgeTo = null;
        });
    },

    createShowPopperFunction(
      embedding: [number, number][],
      popper: HTMLDivElement,
      words: string[],
      callback?: (e: MouseEvent, point: [number, number]) => void
    ): ShowPopper {
      console.assert(embedding.length === words.length);
      return (e: MouseEvent, point) => {
        const index = embedding.indexOf(point);
        const word = words[index];

        popper.hidden = false;
        popper.innerText = word;

        createPopper(e.target as HTMLElement, popper, {
          placement: "right",
        });

        if (callback) {
          callback(e, point);
        }
      };
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

  &.similarity {
    background-color: lightseagreen;
    color: white;
  }
}

.btn.max {
  position: absolute;
  top: 0;
}
</style>
