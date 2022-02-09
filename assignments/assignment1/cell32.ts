import * as d3 from 'd3';
import {
  BLUE,
  GREY,
  svg,
} from './util';


const cell21Margin = { top: 585, right: 30, bottom: 30, left: 468 };

const group32 = svg.select<SVGGElement>('g#cell32')
  .style('transform', `translate(${cell21Margin.left}px, ${cell21Margin.top}px)`);
console.assert(!group32.empty());

// add backdrop
group32.append('rect')
  .attr('x', 128)
  .attr('y', -18)
  .attr('width', 317)
  .attr('height', 185)
  .attr('fill', GREY);

const visMargin = { left: 255, top: 20 };
const visHeight = 130;
const visWidth = 140;

const group21Viz = group32
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
const yAxisEl = group21Viz.append('g')
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

const bars = group21Viz.selectAll('.bar')
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

function drawText(
  text: string, color: string, x: number, y: number, fontSize: string,
): d3.Selection<SVGTextElement, unknown, HTMLElement, any> {
  return group32.append('text')
    .text(text)
    .attr('fill', color)
    .style('font-size', fontSize)
    .style('transform', `translate(${x}px, ${y}px)`);
}

for (const line of [['OUTLOOK', 0]] as const) {
  const [text, y] = line;
  drawText(text, 'white', 5, y, '14px')
    .style('font-weight', '700');
}

const headerDescription = [
  ['One year on, the', 45],
  ['public is still divided', 60],
  ['on when things will', 75],
  ['return to normal', 90],
] as const;

for (const line of headerDescription) {
  const [text, y] = line;
  drawText(text, 'white', 5, y - 28, '11px');
}

const visDescriptionLines = [
  ['How long do you thing it will take before things feel like they are getting', 0],
  ['back to normal?', 12]
] as const;
for (let line of visDescriptionLines) {
  const [text, y] = line;
  drawText(text, BLUE, 135, y - 5, '9px');
}

group32.append('image')
  .attr('href', '/assignment1/watch.svg')
  .style('height', '95px')
  .style('transform', 'translate(127px, 15px)');
