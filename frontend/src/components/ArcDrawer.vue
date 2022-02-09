<template>
  <div class="d-flex">
    <div>
      <label for="arc-size">Arc Size</label>
      <select name="arc-size" id="arc-size" v-model="arcSize">
        <option :key="size" v-for="size in ['small', 'large']" :value="size">
          {{ startCase(size) }}
        </option>
      </select>
    </div>
    <div>
      <label for="path-progress">Path Progress</label>
      <select name="path-progress" id="path-progress" v-model="pathProgress">
        <option
          :key="progress"
          v-for="progress in ['clockwise', 'counter-clockwise']"
          :value="progress"
        >
          {{ startCase(progress) }}
        </option>
      </select>
    </div>
    <div>
      <label for="radius0">Primary Radius</label>
      <input id="radius0" v-model="radius0" type="number" />
    </div>
    <div>
      <label for="radius1">Secondary Radius</label>
      <input id="radius1" v-model="radius1" type="number" />
    </div>
    <div>
      <label for="rotation">Rotation</label>
      <input id="rotation" v-model="rotation" type="number" />
    </div>
  </div>
  <div class="d-flex">
    <div>
      <label for="show-cut-line">Show Cut Line</label>
      <input id="show-cut-line" v-model="showCutLine" type="checkbox" />
    </div>
    <div>
      <label for="show-secondary-arc">Show Secondary Arc</label>
      <input
        id="show-secondary-arc"
        v-model="showSecondaryArc"
        type="checkbox"
      />
    </div>
  </div>
  <svg ref="svg">
    <path
      id="core-arc"
      :d="arcPath"
      fill="transparent"
      stroke="crimson"
      stroke-width="2px"
    ></path>
    <path
      v-if="showSecondaryArc"
      id="secondary-arc"
      :d="secondaryArcPath"
      fill="transparent"
      stroke="crimson"
      stroke-width="2px"
      stroke-opacity=".25"
    ></path>
    <path
      v-if="showCutLine"
      id="cut-line"
      :d="cutLinePath"
      fill="transparent"
      stroke="dodgerblue"
      stroke-width="2px"
    ></path>

    <circle
      id="startPoint"
      class="draggable"
      :cx="startXY.x"
      :cy="startXY.y"
      r="5"
      fill="crimson"
      stroke-width="2px"
      stroke="dodgerblue"
    />

    <circle
      id="endPoint"
      class="draggable"
      :cx="endXY.x"
      :cy="endXY.y"
      r="5"
      fill="crimson"
      stroke-width="2px"
      stroke="dodgerblue"
    />
  </svg>
</template>

<script lang="ts">
import { startCase } from "lodash";
import { defineComponent, PropType } from "vue";

type Point2D = { x: number; y: number };

function makeXYFrom(strXY: string): Point2D {
  const parts = strXY.split(",").map(Number);
  return { x: parts[0], y: parts[1] };
}

export default defineComponent({
  name: "ArcDrawer",
  props: {
    bindDraggable: {
      type: Function as PropType<
        (thisArg: Record<string, unknown>, svg: SVGGraphicsElement) => unknown
      >,
      required: true,
    },
  },
  data() {
    return {
      startPoint: "100,100",
      endPoint: "200,60",
      radius0: "80",
      radius1: "40",
      rotation: "0",
      arcSize: "small" as "small" | "large",
      pathProgress: "clockwise" as "clockwise" | "counter-clockwise",
      showCutLine: true,
      showSecondaryArc: true,
    };
  },
  computed: {
    startXY(): Point2D {
      return makeXYFrom(this.startPoint);
    },
    endXY(): Point2D {
      return makeXYFrom(this.endPoint);
    },
    arcPath(): string {
      return `M ${this.startXY.x} ${this.startXY.y}
      A ${this.radius0} ${this.radius1}
      ${this.rotation}
      ${this.arcSize === "small" ? 0 : 1}
      ${this.pathProgress === "counter-clockwise" ? 0 : 1}
      ${this.endXY.x} ${this.endXY.y}`;
    },
    secondaryArcPath(): string {
      console.log("this.arcSize", this.arcSize);
      return `M ${this.startXY.x} ${this.startXY.y}
      A ${this.radius0} ${this.radius1}
      ${this.rotation}
      ${this.arcSize === "large" ? 0 : 1}
      ${this.pathProgress === "clockwise" ? 0 : 1}
      ${this.endXY.x} ${this.endXY.y}`;
    },
    cutLinePath(): string {
      const slope =
        (this.endXY.y - this.startXY.y) / (this.endXY.x - this.startXY.x);
      const extensionSize = (this.endXY.x - this.startXY.x) * 0.2;
      const startX = this.startXY.x - extensionSize;
      const endX = this.endXY.x + extensionSize;
      const startY = this.startXY.y - extensionSize * slope;
      const endY = this.endXY.y + extensionSize * slope;

      return `M ${startX} ${startY} L ${endX} ${endY}`;
    },
  },
  methods: {
    startCase: startCase,
  },
  mounted(): void {
    const svg = this.$refs.svg as SVGGraphicsElement;
    this.bindDraggable(this.$data, svg);
  },
});
</script>

<style scoped></style>
