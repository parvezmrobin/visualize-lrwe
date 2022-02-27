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
