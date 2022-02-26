<template>
  <div class="root">
    <div>
      <label for="path-type">Draw</label>
      <select id="path-type" v-model="pathType">
        <option
          :key="_pathType"
          :value="_pathType"
          v-for="_pathType in pathTypes"
        >
          {{ startCase(_pathType) }}
        </option>
      </select>
    </div>
    <div class="d-flex-col" style="flex-grow: 1">
      <BezierDrawer
        v-if="['quadratic-bezier', 'cubic-bezier'].includes(pathType)"
        :path-type="pathType"
        :bind-draggable="bindDraggable"
      />
      <ArcDrawer
        v-else-if="pathType === 'arc'"
        :bind-draggable="bindDraggable"
      />
      <PolygonDrawer
        v-else-if="pathType === 'polygon'"
        :bind-draggable="bindDraggable"
      />
    </div>
  </div>
</template>

<script lang="ts">
import ArcDrawer from "@/components/ArcDrawer.vue";
import BezierDrawer from "@/components/BezierDrawer.vue";
import PolygonDrawer from "@/components/PolygonDrawer.vue";
import { defineComponent } from "vue";
import { startCase } from "lodash";

export default defineComponent({
  components: { PolygonDrawer, ArcDrawer, BezierDrawer },
  data() {
    const pathTypes = [
      "arc",
      "polygon",
      "quadratic-bezier",
      "cubic-bezier",
    ] as const;
    return {
      pathTypes: pathTypes,
      pathType: "polygon" as typeof pathTypes[number],
    };
  },

  methods: {
    startCase: startCase,
    /**
     * @see https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
     */
    bindDraggable($data: Record<string, unknown>, svg: SVGGraphicsElement) {
      let dragEl: SVGElement | null = null;
      const startDrag = (event: MouseEvent) => {
        if (
          event.target instanceof SVGElement &&
          event.target.classList.contains("draggable")
        ) {
          dragEl = event.target;
        }
      };
      const getMousePosition = (event: MouseEvent) => {
        const ctm = svg.getScreenCTM() as DOMMatrix;

        return {
          x: (event.clientX - ctm.e) / ctm.a,
          y: (event.clientY - ctm.f) / ctm.d,
        };
      };
      const drag = (event: MouseEvent) => {
        if (!dragEl) {
          return;
        }
        event.preventDefault();
        const coOrdinate = getMousePosition(event);
        const pointPath = dragEl.id.split(".");
        let chileObject = $data;
        // if dragEl.id contains 'foo.bar.baz', after finishing this loop
        // `chileObject` will point to `$data['foo']['bar'] and `key` will
        // be 'baz'
        while (pointPath.length > 1) {
          const pathPart = pointPath.shift() as string;
          chileObject = chileObject[pathPart] as Record<string, unknown>;
        }
        const key = pointPath[0];
        if (typeof chileObject[key] === "string")
          chileObject[key] = `${coOrdinate.x},${coOrdinate.y}`;
        else if (typeof chileObject[key] === "object") {
          chileObject[key] = coOrdinate;
        } else {
          throw new Error(
            `Unhandled co-ordinate type ${typeof chileObject[key]}`
          );
        }
      };

      const endDrag = () => {
        dragEl = null;
      };

      svg.addEventListener("mousedown", startDrag);
      svg.addEventListener("mousemove", drag);
      svg.addEventListener("mouseup", endDrag);
      svg.addEventListener("mouseleave", endDrag);
    },
  },
});
</script>

<style scoped lang="scss">
input,
select {
  border: none;
  border-bottom: 1px solid slategrey;
}

input[type="number"],
input[type="text"] {
  width: 80px;
}

.d-flex-col {
  display: flex;
  flex-direction: column;

  > div {
    flex-grow: 0;
  }
}
.root {
  @extend .d-flex-col;
  height: calc(100vh - 100px);
}

:deep(svg) {
  flex-grow: 1;
  border: 2px solid cornflowerblue;
  border-radius: 5px;
  width: 100%;
}

:deep(.d-flex) {
  display: flex;
  padding: 12px;
  > div {
    flex-grow: 1;
  }
}

:deep(label) {
  padding-right: 12px;
}

:deep(.draggable) {
  cursor: move;
}
</style>
