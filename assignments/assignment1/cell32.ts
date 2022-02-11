import * as d3 from 'd3';
import {
  BLUE,
  drawCellSubtitle,
  drawCellTitle,
  drawVisDescription,
  GREY,
  makeDrawText,
  svg,
} from './util';


const cell21Margin = { top: 585, right: 30, bottom: 30, left: 468 };

const cell32 = svg.select<SVGGElement>('g#cell32')
  .style('transform', `translate(${cell21Margin.left}px, ${cell21Margin.top}px)`);
console.assert(!cell32.empty());

// add backdrop
cell32.append('rect')
  .attr('x', 128)
  .attr('y', -18)
  .attr('width', 317)
  .attr('height', 185)
  .attr('fill', GREY);

const visMargin = { left: 255, top: 20 };
const visHeight = 130;
const visWidth = 140;

const cell32Vis = cell32
  .append('g')
  .attr('id', 'vis21')
  .style('transform', `translate(${visMargin.left}px, ${visMargin.top}px)`);

const data = [
  {
    'key': '1-5 months',
    'value': 16,
  },
  {
    'key': '6 months to a year',
    'value': 36,
  },
  {
    'key': 'Over one year',
    'value': 36,
  },
  {
    'key': 'Never/I have no idea',
    'value': 10,
  },
];

const xScale = d3.scaleLinear()
  .domain([0, Math.max(...data.map((d) => d.value))])
  .range([0, visWidth]);

const yScale = d3.scaleBand()
  .domain(data.map(d => d.key))
  .rangeRound([0, visHeight])
  .padding(.25);

const yAxis = d3.axisLeft<string>(yScale)
  .tickSize(0);

// add y labels
const yAxisEl = cell32Vis.append('g')
  .attr('class', 'y-axis')
  .call(yAxis);
yAxisEl.select('.domain').remove();
yAxisEl.selectAll('text')
  .style('fill', BLUE)
  .style('font-size', '9px');

yAxisEl.selectAll('text')
  .each((_d, i, el) => {
    if (i == 1) {
      const textEl = d3.select(el[i] as SVGTextElement) ;
      textEl.text('')
        .append('tspan')
        .attr('x', -1)
        .attr('dy', '-4px')
        .text('6 months ');
      textEl.append('tspan')
        .attr('x', -4)
        .attr('dy', '12px')
        .text('to a year ');
    }
  })

const bars = cell32Vis.selectAll('.bar')
  .data(data)
  .enter()
  .append('g');

// append rects
bars.append('rect')
  .attr('y', (d) => yScale(d.key) as number)
  .attr('height', yScale.bandwidth())
  .attr('x', 0)
  .attr('width', d => xScale(d.value))
  .attr('fill', BLUE);

// append labels
bars.append('text')
  .attr('class', 'label')
  .attr('y', d => yScale(d.key) as number + yScale.bandwidth() / 2)
  .attr('x', d => xScale(d.value) + 5)
  .text(d => `${d.value}%`)
  .style('font-weight', 'bold')
  .style('fill', BLUE)
  .style('font-size', '14px')
  .style('alignment-baseline', 'middle');

const drawText = makeDrawText(cell32);

drawCellTitle([['OUTLOOK', 0]], drawText);

const headerDescription = [
  ['One year on, the', 45],
  ['public is still divided', 60],
  ['on when things will', 75],
  ['return to normal', 90],
] as const;

drawCellSubtitle(headerDescription, drawText);

const visDescriptionLines = [
  'How long do you thing it will take before things feel like they are getting',
  'back to normal?',
];
drawVisDescription(
  visDescriptionLines,
  135,
  (i) => i * 12 - 5,
  drawText,
)

cell32.append('image')
  .attr('href', '/assignment1/watch.svg')
  .style('height', '95px')
  .style('transform', 'translate(127px, 15px)');
