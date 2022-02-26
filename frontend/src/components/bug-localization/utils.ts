export function computeSvgSize(svg: SVGElement): number {
  if (document.fullscreenElement) {
    return svg.clientWidth;
  } else {
    return Math.min(svg.clientWidth, window.innerHeight - 130);
  }
}
