<template>
  <div class="home">
    <svg width="80vw" height="80vh" style="overflow: visible" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as d3 from "d3";

export default defineComponent({
  name: "Home",
  mounted(): void {
    this.loadShapValues();
  },
  methods: {
    async loadShapValues() {
      const resp = await fetch("http://localhost:5000/shap-values/wine/1");
      const { header, values }: { header: string[]; values: number[][] } =
        await resp.json();
      const svg = d3.select<SVGElement, null>("svg");
      const margin = 200;
      const width = Number.parseFloat(svg.style("width")) - margin;
      const height = Number.parseFloat(svg.style("height")) - margin;

      const xScale = d3.scaleBand().range([0, width]).padding(0.4);
      const yScale = d3.scaleLinear().range([height, 0]);

      const rootGroup = svg.append("g").attr("transform", `translate(10, 100)`);

      const classIndex = 0;
      xScale.domain(header);
      const yMax = d3.max(values, (value) => value[classIndex]);
      const yMin = d3.min(values, (value) => value[classIndex]);
      if (yMin === undefined || yMax === undefined) {
        throw new Error("values should not be empty");
      }
      const padding = (yMax - yMin) * 0.1;
      yScale.domain([yMin - padding, yMax + padding]);

      rootGroup
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("font-size", 12)
        .style("text-anchor", "end")
        .attr("transform", "translate(-13, 10) rotate(-90)");

      rootGroup.append("g").call(
        d3
          .axisLeft(yScale)
          .tickFormat((d) => Number.parseFloat(d.toString()).toFixed(2))
          .ticks(10)
      );

      rootGroup
        .selectAll(".bar")
        .data(values)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => xScale(header[i]) || null)
        .attr("y", (d) => yScale((d as number[])[classIndex]))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => height - yScale((d as number[])[classIndex]));
    },
  },
});
</script>
