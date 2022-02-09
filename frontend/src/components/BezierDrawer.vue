<template>
  <div class="d-flex">
    <div>
      <label for="start-point">Start Point</label>
      <input id="start-point" v-model="startPoint" type="text" />
    </div>
    <div>
      <label for="end-point">End Point</label>
      <input id="end-point" v-model="endPoint" type="text" />
    </div>
    <div>
      <label for="anchor"
        >Anchor{{ pathType === "cubic-bezier" ? " 0" : "" }}</label
      >
      <input id="anchor" v-model="anchor" type="text" />
    </div>
    <div v-show="pathType === 'cubic-bezier'">
      <label for="anchor1">Anchor 1</label>
      <input id="anchor1" v-model="anchor1" type="text" />
    </div>
  </div>

  <svg ref="svg">
    <path
      id="core-curve"
      :d="bezierPath"
      fill="transparent"
      stroke="crimson"
      stroke-width="2px"
    ></path>

    <path
      id="anchor-line"
      :d="`M ${startXY.x} ${startXY.y} L ${anchorXY.x} ${anchorXY.y}`"
      stroke="dodgerblue"
      stroke-width="2px"
    />

    <path
      v-if="pathType === 'cubic-bezier'"
      id="anchor1-line"
      :d="`M ${endXY.x} ${endXY.y} L ${anchor1XY.x} ${anchor1XY.y}`"
      stroke="dodgerblue"
      stroke-width="2px"
    />

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

    <circle
      id="anchor"
      class="draggable"
      :cx="anchorXY.x"
      :cy="anchorXY.y"
      r="5"
      fill="dodgerblue"
      stroke-width="2px"
      stroke="coral"
    />

    <circle
      v-if="pathType === 'cubic-bezier'"
      id="anchor1"
      class="draggable"
      :cx="anchor1XY.x"
      :cy="anchor1XY.y"
      r="5"
      fill="dodgerblue"
      stroke-width="2px"
      stroke="coral"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

type Point2D = { x: number; y: number };

function makeXYFrom(strXY: string): Point2D {
  const parts = strXY.split(",").map(Number);
  return { x: parts[0], y: parts[1] };
}
export default defineComponent({
  name: "BezierDrawer",
  props: {
    pathType: {
      type: String as PropType<"quadratic-bezier" | "cubic-bezier">,
      required: true,
    },
    bindDraggable: {
      type: Function as PropType<
        (thisArg: Record<string, unknown>, svg: SVGGraphicsElement) => unknown
      >,
      required: true,
    },
  },
  data() {
    return {
      startPoint: "0,100",
      endPoint: "100,100",
      anchor: "40,50",
      anchor1: "60,50",
    };
  },
  computed: {
    startXY(): Point2D {
      return makeXYFrom(this.startPoint);
    },
    endXY(): Point2D {
      return makeXYFrom(this.endPoint);
    },
    anchorXY(): Point2D {
      return makeXYFrom(this.anchor);
    },
    anchor1XY(): Point2D {
      return makeXYFrom(this.anchor1);
    },
    bezierPath(): string {
      if (!["quadratic-bezier", "cubic-bezier"].includes(this.pathType)) {
        return "";
      }
      let path = `M ${this.startXY.x} ${this.startXY.y}`;
      if (this.pathType === "cubic-bezier") {
        path += " C";
      } else {
        path += " Q";
      }

      path += ` ${this.anchorXY.x} ${this.anchorXY.y}`;
      if (this.pathType === "cubic-bezier") {
        path += ` ${this.anchor1XY.x} ${this.anchor1XY.y}`;
      }

      path += ` ${this.endXY.x} ${this.endXY.y}`;

      return path;
    },
  },
  mounted(): void {
    const svg = this.$refs.svg as SVGGraphicsElement;
    this.bindDraggable(this.$data, svg);
  },
});
</script>

<style scoped></style>
