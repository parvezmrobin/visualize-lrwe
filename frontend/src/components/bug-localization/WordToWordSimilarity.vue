<template>
  <div class="mb-3 row" v-show="files.length">
    <label for="select-file" class="col-sm-3 col-lg-2 col-form-label"
      >Select A File</label
    >
    <div class="col-sm-6">
      <select v-model="selectedFile" class="form-control" id="select-file">
        <option
          :key="file"
          v-for="file in files.slice(0, 100)"
          :value="file"
          :style="{ backgroundColor: getFileBackground(file) }"
        >
          {{ file }}
        </option>
      </select>
    </div>

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
    <svg class="border border-info rounded" ref="svg" />
    <div ref="popperBugReport" class="popper br" hidden></div>
    <div ref="popperFile" class="popper file" hidden></div>
  </div>
</template>

<script lang="ts">
import { computeSvgSize } from "@/utils";
import { TSNEPayload } from "@/store";
import { createPopper } from "@popperjs/core";
import axios from "axios";
import * as d3 from "d3";
import { defineComponent, PropType } from "vue";
import { mapState } from "vuex";

export default defineComponent({
  name: "WordToWordSimilarity",

  props: {
    fileColor: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
  },

  data() {
    return {
      dimension: "pca",
    };
  },

  computed: {
    ...mapState(["selectedBug", "similarity", "tSNE"]),
    selectedFile: {
      get() {
        return this.$store.state.selectedFile;
      },
      set(value: string) {
        this.$store.state.selectedFile = value;
      },
    },
    files(): string[] {
      return Object.keys(this.similarity?.asymmetricSimilarity || {});
    },
  },

  watch: {
    selectedBug() {
      this.dimension = "pca";
    },
    async selectedFile() {
      await this.$nextTick(); // let the svg to show
      this.drawSimilarity();
    },
    async dimension() {
      if (this.dimension === "tsne" && !this.tSNE) {
        this.$store.state.isLoading = true;
        const resp = await axios.post<TSNEPayload>(
          `/bug/${this.selectedBug}/tsne`,
          {
            filenames: Object.keys(this.similarity?.asymmetricSimilarity),
            topWordIndices: this.similarity?.topWordIndices,
          }
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
      const DOT_RADIUS = 3;

      const svg = this.$refs.svg as SVGElement;
      const size = computeSvgSize(svg);
      svg.style.height = `${size}px`;
      svg.style.width = `${size}px`;

      d3.select(svg).selectAll("g").remove();

      let fileEmbedding: [number, number][];
      let bugReportEmbedding: [number, number][];
      if (this.dimension === "pca") {
        fileEmbedding = this.similarity.fileEmbeddingsPCA[this.selectedFile];
        bugReportEmbedding = this.similarity.bugReportEmbeddingPCA;
      } else {
        fileEmbedding = this.tSNE.fileEmbeddingsTSNE[this.selectedFile];
        bugReportEmbedding = this.tSNE.bugReportEmbeddingTSNE;
      }
      const min = Math.min(
        ...fileEmbedding.flat(),
        ...bugReportEmbedding.flat()
      );
      const max = Math.max(
        ...fileEmbedding.flat(),
        ...bugReportEmbedding.flat()
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
        popper: HTMLDivElement,
        words: string[]
      ): ShowPopper => {
        console.assert(embedding.length === words.length);
        return (e: MouseEvent, point) => {
          const index = embedding.indexOf(point);
          const word = words[index];

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
        .data<[number, number]>(fileEmbedding)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale((d as number[])[0]))
        .attr("cy", (d) => yScale((d as number[])[1]))
        .attr("r", DOT_RADIUS)
        .style("fill", "magenta")
        .on(
          "mouseenter",
          createShowPopperFunction(
            fileEmbedding,
            this.$refs.popperFile as HTMLDivElement,
            this.similarity.fileTokens[this.selectedFile]
          )
        )
        .on("mouseout", () => {
          const popper = this.$refs.popperFile as HTMLDivElement;
          popper.hidden = true;
        });

      d3.select(svg)
        .append("g")
        .selectAll(".br.dot")
        .data<[number, number]>(bugReportEmbedding)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d[0]))
        .attr("cy", (d) => yScale(d[1]))
        .attr("r", DOT_RADIUS)
        .style("fill", "teal")
        .on(
          "mouseenter",
          createShowPopperFunction(
            bugReportEmbedding,
            this.$refs.popperBugReport as HTMLDivElement,
            this.similarity.bugReportTokens
          )
        )
        .on("mouseout", () => {
          const popper = this.$refs.popperBugReport as HTMLDivElement;
          popper.hidden = true;
        });
    },

    getFileBackground(filename: string) {
      const fileColor = this.fileColor[filename];
      if (!fileColor) {
        return "transparent";
      }

      return fileColor;
    },

    getFileForeground(filename: string) {
      const fileColor = this.fileColor[filename];
      if (!fileColor) {
        return "black";
      }

      return fileColor[1];
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
}

.btn.max {
  position: absolute;
  top: 0;
}
</style>
