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
import { computeSvgSize, D3Selection } from "@/utils";
import { TSNEPayload } from "@/store";
import { createPopper } from "@popperjs/core";
import axios from "axios";
import * as d3 from "d3";
import { defineComponent, PropType } from "vue";
import { mapState } from "vuex";

type ShowPopper = (e: MouseEvent, point: [number, number]) => void;
const DOT_RADIUS = 3;

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
      const margin = {
        left: 50,
        bottom: 50,
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
        .range([DOT_RADIUS + margin.left, svg.clientWidth - DOT_RADIUS]);

      const yScale = d3
        .scaleLinear()
        .domain([Math.min(...yValues), Math.max(...yValues)])
        .range([svg.clientWidth - DOT_RADIUS - margin.bottom, DOT_RADIUS]);

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
      const pointsWithData = svg
        .selectAll(`.${key}.dot`)
        .data<[number, number]>(embedding);
      pointsWithData.exit().remove();
      pointsWithData.enter().append("circle").attr("class", `${key} dot`);

      // now take all points (existing + appended) and set/update position
      svg
        .selectAll<SVGCircleElement, [number, number]>(`circle.${key}.dot`)
        .on(
          "mouseenter",
          this.createShowPopperFunction(
            embedding,
            this.$refs.popperFile as HTMLDivElement,
            tokens
          )
        )
        .on("mouseout", () => {
          const popper = this.$refs.popperFile as HTMLDivElement;
          popper.hidden = true;
        })
        .transition()
        .attr("cx", (d) => xScale(d[0]))
        .attr("cy", (d) => yScale(d[1]))
        .attr("r", DOT_RADIUS)
        .style("fill", color);
    },

    createShowPopperFunction(
      embedding: [number, number][],
      popper: HTMLDivElement,
      words: string[]
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
      };
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
