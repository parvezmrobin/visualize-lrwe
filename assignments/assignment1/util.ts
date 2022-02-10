import * as d3 from 'd3';
import { select } from 'd3';

export const BLUE = '#30469C';
export const TEAL = '#41999A';
export const GREY = '#E9E9EB';

export const svg = select('svg');

export type SVGTextElementSelection = d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
export type SVGGElementSelection = d3.Selection<SVGGElement, unknown, HTMLElement, any>;

export function drawBackDrop(
  cell: SVGGElementSelection, x: number, y: number, width: number, height: number,
): void {
  cell.append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', GREY);
}

export type DrawText = (
  text: string, color: string, x: number, y: number, fontSize: string,
) => SVGTextElementSelection;

export function makeDrawText(cell: SVGGElementSelection): DrawText {
  return (
    text: string, color: string, x: number, y: number, fontSize: string,
  ): SVGTextElementSelection => cell.append('text')
    .text(text)
    .attr('fill', color)
    .style('font-size', fontSize)
    .style('transform', `translate(${x}px, ${y}px)`);
}

type ReadOnlyYLines = readonly (readonly [string, number])[];

export function drawCellTitle(titleLines: ReadOnlyYLines, drawText: DrawText): void {
  for (const line of titleLines) {
    const [text, y] = line;
    drawText(text, 'white', 5, y, '14px')
      .style('font-weight', '700');
  }
}

export function drawCellSubtitle(lines: ReadOnlyYLines, drawText: DrawText): void {
  for (const line of lines) {
    const [text, y] = line;
    drawText(text, 'white', 5, y, '11px');
  }
}

export function drawVisDescription(descriptions: string[], x: number, yExpr: (i: number) => number, drawText: DrawText): void {
  for (let i = 0; i < descriptions.length; i++) {
    let line = descriptions[i];
    drawText(
      line,
      BLUE,
      x,
      yExpr(i),
      '9.5px',
    );
    // Ref: https://stackoverflow.com/a/8100970/5420257
    // .attr('xml:space', 'preserve');
  }
}
