import * as d3 from 'd3';
import {
  BLUE,
  drawMonthDateAxisBottom,
  formatDate,
  GREY,
  svg,
  TEAL,
} from './util';

type Datum = {
  date: Date,
  value: number;
}
const jsonData = (await d3.json<{
  date: string,
  value: number;
}[]>('/assignment1/cell31.json'));
if (jsonData === undefined) {
  throw new Error('Filed to load data');
}
const data: Datum[] = jsonData.map(({date, value}) => ({
  date: new Date(date),
  value,
}));

const cell31Margin = { top: 570, right: 30, bottom: 30, left: 18 };

const cell31 = svg.select<SVGGElement>('g#cell31')
  .style('transform', `translate(${cell31Margin.left}px, ${cell31Margin.top}px)`);

// add backdrop
cell31.append('rect')
  .attr('x', 125)
  .attr('y', 0)
  .attr('width', 317)
  .attr('height', 175)
  .attr('fill', GREY);

const visMargin = { left: 130, top: 65 };
const visWidth = 300;
const visHeight = 160;
const visAxisPadding = { left: 15, bottom: 95 };

const group11Viz = cell31
  .append('g')
  .attr('id', 'vis11')
  .style('transform', `translate(${visMargin.left}px, ${visMargin.top}px)`);

// Add X axis
const scaleX = (function drawXAxis() {
  const scaleX = d3.scaleTime()
    .domain([
      new Date(Math.min(...data.map(d => d.date.valueOf()))),
      new Date(Math.max(...data.map(d => d.date.valueOf()))),
    ])
    .range([visAxisPadding.left, visWidth - 10]);


  const tickValues = [
    new Date('27 Aug 2020'),
    new Date('8 Oct 2020'),
    new Date('3 Dec 2020'),
    new Date('Jan 28 2021'),
    new Date('Mar 11 2021'),
  ];
  const xAxis = drawMonthDateAxisBottom(
    group11Viz,
    scaleX,
    tickValues,
    -2,
    visHeight - visAxisPadding.bottom + 20,
    BLUE,
  );

  // manually increasing the axis length to match the reference
  xAxis.select('.domain').style('transform', 'translateX(-15px) scaleX(1.1)')
    .style('stroke', '#D9D9D9');

  xAxis.selectAll('text')
    .each((_, index, groups) => {
      const textEl = groups[index] as SVGTextElement;
      const startDate = new Date(textEl.textContent as string);
      const endDate = new Date(startDate.setDate(startDate.getDate() + 4));
      if (textEl.textContent === 'Oct 8') {
        endDate.setDate(endDate.getDate() + 1);
      }
      textEl.textContent += ' -';
      d3.select(textEl.parentNode as SVGElement)
        .append('text')
        .text(formatDate(endDate))
        .attr('y', textEl.getAttribute('y'))
        .attr('dy', Number.parseFloat(textEl.getAttribute('dy') as string) + 15)
        .style('fill', BLUE)
        .style('font-size', '7px')
        .style('font-weight', 'bold');
    });

  return scaleX;
})();

// Add Y axis
const scaleY = (function drawYAxis() {
  return d3.scaleLinear()
    .domain([
      Math.min(...data.map(d => d.value)),
      Math.max(...data.map(d => d.value)),
    ])
    .range([visHeight - visAxisPadding.bottom, 0]);
})();

(function drawLines() {
  const tealLine = d3.line<Datum>()
    .curve(d3.curveMonotoneX)
    .x(d => scaleX(new Date(d.date)))
    .y(d => scaleY(d.value));
  group11Viz.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', TEAL)
    .attr('stroke-width', 2)
    .attr('d', tealLine);
})();

function drawText(
  text: string, color: string, x: number, y: number, fontSize: string,
): d3.Selection<SVGTextElement, unknown, HTMLElement, any> {
  return cell31.append('text')
    .text(text)
    .attr('fill', color)
    .style('font-size', fontSize)
    .style('transform', `translate(${x}px, ${y}px)`);
}

for (const line of [['FEELING OF', 15], ['CONTROL', 30]] as const) {
  const [text, y] = line;
  drawText(text, 'white', 5, y, '14px')
    .style('font-weight', '700');
}

const lines = [
  ['The proportion saying', 45],
  ['that things feel out of', 60],
  ['control is falling fast', 75],
] as const;

for (const line of lines) {
  const [text, y] = line;
  drawText(text, 'white', 5, y, '11px');
}

const visDescriptions = [
  ' To what extent do you agree or disagree with each of the following? ′I',
  'fill like things in my country are out of control right now‘',
];
for (let i = 0; i < visDescriptions.length; i++) {
  let line = visDescriptions[i];
  drawText(
    line,
    BLUE,
    visMargin.left,
    10 + i * 12,
    '9.5px',
  );
  // Ref: https://stackoverflow.com/a/8100970/5420257
  // .attr('xml:space', 'preserve');
}

drawText(
  '% ‘Strongly agree′ + ‘Somewhat agree′',
  BLUE,
  visMargin.left + 50,
  40,
  '10px',
).style('font-weight', '700');

const valueLabels = [
  ['57%', -10, 125],
  ['79%', 55, 60],
  ['62%', 128, 115],
  ['78%', 195, 62],
  ['50%', 265, 120],
] as const;

for (let valueLabel of valueLabels) {
  const [label, x, y] = valueLabel;
  drawText(label, TEAL, x + 150, y, '10px')
    .style('font-weight', 'bold');
}

