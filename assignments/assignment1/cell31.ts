import * as d3 from 'd3';
import {
  BLUE,
  drawMonthDateAxisBottom,
  formatDate,
  GREY,
  svg,
  TEAL,
} from './util';


const data = [
  {
    'date': new Date('27 Aug 2020'),
    'value': 57,
  },
  {
    'date': new Date('24 Sep 2020'),
    'value': 77,
  },
  {
    'date': new Date('1 Oct 2020'),
    'value': 77,
  },
  {
    'date': new Date('8 Oct 2020'),
    'value': 78,
  },
  {
    'date': new Date('15 Oct 2020'),
    'value': 79,
  },
  {
    'date': new Date('22 Oct 2020'),
    'value': 78,
  },
  {
    'date': new Date('19 Nov 2020'),
    'value': 71,
  },
  {
    'date': new Date('19 Nov 2020'),
    'value': 71,
  },
  {
    'date': new Date('26 Nov 2020'),
    'value': 65,
  },
  {
    'date': new Date('3 Dec 2020'),
    'value': 62,
  },
  {
    'date': new Date('10 Dec 2020'),
    'value': 65,
  },
  {
    'date': new Date('17 Dec 2020'),
    'value': 70,
  },
  {
    'date': new Date('24 Dec 2020'),
    'value': 73,
  },
  {
    'date': new Date('31 Dec 2020'),
    'value': 75,
  },
  {
    'date': new Date('14 Jan 2021'),
    'value': 78,
  },
  {
    'date': new Date('28 Jan 2021'),
    'value': 75,
  },
  {
    'date': new Date('11 Feb 2021'),
    'value': 67,
  },
  {
    'date': new Date('4 Mar 2021'),
    'value': 49,
  },
  {
    'date': new Date('11 Mar 2021'),
    'value': 50,
  },
];
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
const visWidth = 280;
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
    .range([visAxisPadding.left, visWidth]);


  const tickValues = [
    new Date('27 Aug 2020'),
    new Date('8 Oct 2020'),
    new Date('3 Dec 2020'),
    new Date('Jan 28 2021'),
    new Date('Mar 11 2021'),
  ];
  const xAxis = drawMonthDateAxisBottom(group11Viz, scaleX, tickValues, 0, visHeight - visAxisPadding.bottom + 20, BLUE);

  xAxis.selectAll('text')
    .each((_, index, groups) => {
      const textEl = groups[index] as SVGTextElement;
      const startDate = new Date(textEl.textContent as string);
      textEl.textContent += ' -';
      const endDate = new Date(startDate.setDate(startDate.getDate() + 4));
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
  const tealLine = d3.line<typeof data[number]>()
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
  ['62%', 120, 115],
  ['78%', 180, 62],
  ['50%', 250, 120],
] as const;

for (let valueLabel of valueLabels) {
  const [label, x, y] = valueLabel;
  drawText(label, TEAL, x + 150, y, '10px')
    .style('font-weight', 'bold');
}

