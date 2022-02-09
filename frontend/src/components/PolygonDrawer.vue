<template>
  <div class="d-flex">
    <div>
      <label for="num-points">Number of Points</label>
      <input id="num-points" v-model="numPoints" type="number" />
    </div>
  </div>
  <svg ref="svg">
    <path
      id="core-path"
      :d="polygonPath"
      fill="transparent"
      stroke="crimson"
      stroke-width="2px"
    ></path>

    <circle
      v-for="i in numPoints"
      :key="`${points[i - 1].x},${points[i - 1].y}`"
      :id="`points.${i - 1}`"
      class="draggable"
      :cx="points[i - 1].x"
      :cy="points[i - 1].y"
      r="5"
      fill="crimson"
      stroke-width="2px"
      stroke="dodgerblue"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "PolygonDrawer",
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
      numPoints: 4,
      points: [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 200 },
        { x: 100, y: 200 },
      ],
    };
  },
  computed: {
    polygonPath(): string {
      let path = `M ${this.points[0].x} ${this.points[0].y} `;
      for (let i = 1; i < this.numPoints; i++) {
        const point = this.points[i];
        path += `L ${point.x} ${point.y} `;
      }
      path += "Z";

      return path;
    },
  },
  watch: {
    numPoints() {
      if (this.numPoints <= this.points.length) {
        return;
      }
      const newPoint = {
        x: (this.points[0].x + this.points[this.points.length - 1].x) / 2,
        y: (this.points[0].y + this.points[this.points.length - 1].y) / 2,
      };
      this.points.push(newPoint);
    },
  },
  mounted(): void {
    const svg = this.$refs.svg as SVGGraphicsElement;
    this.bindDraggable(this.$data, svg);
  },
});
</script>

<style scoped></style>
