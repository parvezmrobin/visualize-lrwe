import * as d3 from 'd3';
import {
  BLUE,
  drawCellSubtitle,
  drawCellTitle,
  drawVisDescription,
  GREY,
  makeDrawText,
  svg,
  TEAL,
} from './util';


type Datum = { date: string; value: [number, number] };
const data = await d3.json<Datum[]>(
  '/assignment1/cell11.json',
);
if (data === undefined) {
  throw new Error('Could not fetch data');
}
const cell11Margin = { top: 170, right: 30, bottom: 30, left: 18 },
  height = 400 - cell11Margin.top - cell11Margin.bottom;

const group11 = svg.select<SVGGElement>('g#cell11')
  .style('transform', `translate(${cell11Margin.left}px, ${cell11Margin.top}px)`);

// add backdrop
group11.append('rect')
  .attr('x', 125)
  .attr('y', 0)
  .attr('width', 317)
  .attr('height', 165)
  .attr('fill', GREY);

const visMargin = { left: 170, top: 20 };
const visWidth = 190;
const visHeight = 100;
const visAxisPadding = { left: 0, bottom: 95, top: 30 };

const group11Viz = group11
  .append('g')
  .attr('id', 'vis11')
  .style('transform', `translate(${visMargin.left}px, ${visMargin.top}px)`);

// Add X axis
const scaleX = (function drawXAxis() {
  const scaleX = d3.scaleTime()
    .domain(
      d3.extent(data, ({ date }) => new Date(date)) as Date[],
    )
    .range([visAxisPadding.left, visWidth]);


  const tickFormat = (d: Date | d3.NumberValue) => (d as Date).toDateString()
    .split(' ')
    .filter((_, i) => i % 2)
    .join('-');
  const axisX = d3.axisBottom(scaleX)
    .tickFormat(tickFormat);
  group11Viz.append('g')
    .attr('transform', `translate(0, ${visHeight})`)
    .call(axisX)
    // Ref: https://github.com/d3/d3-axis/issues/48#issuecomment-415820666
    .call(g => g.selectAll('.domain, line').remove())
    // Ref: https://stackoverflow.com/a/16863559/5420257
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-1em')
    .attr('dy', '-.5em')
    .attr('transform', 'rotate(-90)')
    .style('font-size', '7px')
    .style('font-weight', '600')
    .style('color', BLUE);

  return scaleX;
})();

// Add Y axis
const scaleY = (function drawYAxis() {
  const scaleY = d3.scaleLinear()
    .domain([0, 100])
    .range([height - visAxisPadding.bottom, visAxisPadding.top]);

  const axisY = d3.axisLeft(scaleY)
    .ticks(5)
    .tickFormat((val) => `${val}%`);
  group11Viz.append('g')
    .call(axisY)
    // Ref: https://github.com/d3/d3-axis/issues/48#issuecomment-415820666
    .call(g => g.selectAll('.domain, line').remove())
    .selectAll('text')
    .style('color', BLUE);

  return scaleY;
})();

(function drawLines() {
  const blueLine = d3.line<Datum>()
    .curve(d3.curveCardinal)
    .x(d => scaleX(new Date(d.date)))
    .y(d => scaleY(d.value[0]));
  group11Viz.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', BLUE)
    .attr('stroke-width', 5)
    .attr('d', blueLine);

  const tealLine = d3.line<Datum>()
    .curve(d3.curveCardinal)
    .x(d => scaleX(new Date(d.date)))
    .y(d => scaleY(d.value[1]));
  group11Viz.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', TEAL)
    .attr('stroke-width', 5)
    .attr('d', tealLine);
})();

const drawText = makeDrawText(group11);

drawCellTitle([['PLANNING NHS', 15], ['RESPONSE', 30]], drawText);
const lines = [
  ['Confidence in the', 45],
  ['NHS is at its highest', 60],
  ['since June 2020', 75],
] as const;

drawCellSubtitle(lines, drawText);

const visDescriptions = [
  'How confident, if at all, would you say you are in the ability of the NHS to',
  'deal with those who are ill as a result of getting the Coronavirus?',
];
drawVisDescription(
  visDescriptions,
  visMargin.left - 35,
  (i) => visMargin.top + i * 12,
  drawText,
);


drawText(
  'Mar 2020 — Feb 2021',
  'black',
  visMargin.left + 70,
  visMargin.top + 30,
  '10px',
).style('font-weight', '700');

group11.append('rect')
  .attr('x', '370')
  .attr('y', '50')
  .attr('width', '8')
  .attr('height', '30')
  .style('fill', TEAL);

drawText('79%', TEAL, 380, 65, '10px');
drawText('Confident', TEAL, 380, 76, '10px');

group11.append('rect')
  .attr('x', '370')
  .attr('y', '90')
  .attr('width', '8')
  .attr('height', '30')
  .style('fill', BLUE);

drawText('17%', BLUE, 380, 105, '10px');
drawText('Not confident', BLUE, 380, 116, '10px');
