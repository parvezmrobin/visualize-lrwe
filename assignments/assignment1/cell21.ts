import * as d3 from 'd3';
import {
  BLUE,
  GREY,
  svg,
  TEAL,
} from './util';


const cell21Margin = { top: 385, right: 30, bottom: 30, left: 18 };

const group21 = svg.select<SVGGElement>('g#cell21')
  .style('transform', `translate(${cell21Margin.left}px, ${cell21Margin.top}px)`);
console.assert(!group21.empty());

// add backdrop
group21.append('rect')
  .attr('x', 125)
  .attr('y', -10)
  .attr('width', 317)
  .attr('height', 165)
  .attr('fill', GREY);

const visMargin = { left: 140, top: 10 };
const visRadius = 70;

const group21Viz = group21
  .append('g')
  .attr('id', 'vis21')
  .style('transform', `translate(${visMargin.left + visRadius}px, ${visMargin.top + visRadius}px)`);

const data = [
  {
    'key': 'Strongly agree',
    'value': 65,
    'color': '#214D4E',
  },
  {
    'key': 'Somewhat agree',
    'value': 18,
    'color': '#317372',
  },
  {
    'key': 'Somewhat disagree',
    'value': 9,
    'color': '#2F469C',
  },
  {
    'key': 'Strongly disagree',
    'value': 8,
    'color': '#002454',
  },
];

const colorScale = d3.scaleOrdinal<typeof data[number], string>()
  .domain(data)
  .range(data.map((entry) => entry.color));

const pieChart = d3.pie<typeof data[number]>()
  .value((d) => d.value);

const piedData = pieChart(data);

const arcGenerator = d3.arc<SVGPathElement, typeof piedData[number]>()
  .innerRadius(visRadius - 30)
  .outerRadius(visRadius);
group21Viz
  .selectAll('.pie-slice')
  .data(piedData)
  .enter()
  .append('path')
  .attr('d', arcGenerator)
  .attr('fill', (d) => colorScale(d.data));

group21Viz
  .selectAll('.pie-slice')
  .data(piedData)
  .enter()
  .append('text')
  .text(d => `${d.data.value}%`)
  .attr('transform', d => `translate(${arcGenerator.centroid(d)})`)
  .style('text-anchor', 'middle')
  .style('alignment-baseline', 'middle')
  .style('font-size', '14px')
  .style('fill', 'white')
  .style('font-weight', '700');

function drawText(
  text: string, color: string, x: number, y: number, fontSize: string,
): d3.Selection<SVGTextElement, unknown, HTMLElement, any> {
  return group21.append('text')
    .text(text)
    .attr('fill', color)
    .style('font-size', fontSize)
    .style('transform', `translate(${x}px, ${y}px)`);
}

for (const line of [['VACCINATION', 0], ['INTENT', 15]] as const) {
  const [text, y] = line;
  drawText(
    text,
    'white',
    5,
    y,
    '14px',
  ).style('font-weight', '700');
}

const headerDescription = [
  ['Intention among the', 45],
  ['UK public to get the', 60],
  ['COVID-19 vaccine has', 75],
  ['increased', 90],
] as const;

for (const line of headerDescription) {
  const [text, y] = line;
  drawText(
    text,
    'white',
    5,
    y - 15,
    '11px',
  );
}

drawText(
  'If a vaccine for COVID-19 were available to me, I would get it',
  BLUE,
  visMargin.left,
  visMargin.top - 10,
  '9px',
);

const piChartIndicator = [
  ['52% ‘strongly agreed′', 300, 25],
  ['in Aug 2020', 325, 40],
  ['48% ‘strongly agreed′', 300, 60],
  ['in Dec 2020', 325, 75],
] as const;

for (const line of piChartIndicator) {
  const [text, x, y] = line;
  drawText(text, TEAL, x + 20, y, '10px')
    .style('font-weight', '700');
}

function drawRect(x: number, y: number, color: string) {
  return group21.append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', '5')
    .attr('height', '5')
    .style('fill', color);
}

const legendOffset = 100;
for (let i = 0; i < data.length; i++) {
  const entry = data[i];

  const y = legendOffset + i * 15;
  drawRect(325, y, entry.color);
  drawText(entry.key, BLUE, 335, y, '9px')
    .style('alignment-baseline', 'hanging');
}

group21.append('image')
  .attr('href', '/assignment1/assets/right-arrow.svg')
  .style('height', '55px')
  .style('transform', 'translate(340px, 55px) rotate(150deg)');
