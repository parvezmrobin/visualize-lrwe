import type { BaseType, Selection } from "d3";
import * as d3 from "d3";
import { select } from "d3";

export function computeSvgSize(svg: SVGElement): number {
  if (document.fullscreenElement) {
    return svg.clientWidth;
  } else {
    // due to precision errors, SVG's width keeps decreasing
    // over time. therefore, computing based on parent.
    return Math.min(
      svg.parentElement?.clientWidth as number,
      window.innerHeight - 130
    );
  }
}

export const formatFileTick = (t: string): string => {
  t = t.replaceAll("\\", "/");
  if (t.length < 50) {
    return t;
  }
  const parts = t.split("/");
  return parts.slice(0, 3).join("/") + "/.../" + parts[parts.length - 1];
};

export type D3Selection<T extends BaseType, Datum = unknown> = Selection<
  T,
  Datum,
  BaseType,
  never
>;

export function makeTooltipUtils(ref: unknown): {
  tooltip: D3Selection<HTMLDivElement>;
  hideTooltip: () => void;
  moveTooltip: (e: MouseEvent) => void;
} {
  if (!(ref instanceof HTMLDivElement)) {
    throw new Error("`ref` must be an `HTMLDivElement`");
  }
  const tooltip = select(ref as HTMLDivElement);

  const hideTooltip = () => {
    tooltip.style("visibility", "hidden");
  };
  const moveTooltip = (e: MouseEvent) => {
    tooltip
      .style("bottom", `calc(100vh - ${e.y - 5}px)`)
      .style("right", `calc(100vw - ${e.x}px)`);
  };
  return { tooltip, hideTooltip, moveTooltip };
}

export function addFilenameHoverSupport(
  axis: D3Selection<SVGGElement>,
  ref: unknown
): void {
  const { tooltip, hideTooltip, moveTooltip } = makeTooltipUtils(ref);
  axis
    .selectAll<SVGTextElement, string>("line+text")
    .on("mouseover", (e, d) => {
      tooltip
        .html(`<code class="text-info">${d}</code>`)
        .style("visibility", "visible")
        .style("background-color", "var(--bs-dark)");
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);
}

export function makeColorScale(
  domain: readonly [number, number]
): d3.ScaleLinear<d3.RGBColor, string> {
  const colorScale = d3
    .scaleLinear<d3.RGBColor>()
    .domain(domain)
    .range([d3.rgb(0, 114, 178), d3.rgb(213, 94, 0)])
    .interpolate(d3.interpolateLab);
  return colorScale;
}
