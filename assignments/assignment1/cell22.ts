import * as d3 from 'd3';
import {
  BLUE,
  drawBackDrop,
  drawCellSubtitle,
  drawCellTitle,
  drawMonthDateAxisBottom,
  drawVisDescription,
  makeDrawText,
  svg,
  TEAL,
} from './util';

/**
 * As this curve is too complex, it was hard to guess the values.
 * Thus, I took a screenshot of the graph and read it as matrix
 * (with matplotlib python library). For each column in the matrix,
 * I find the index of the maximum value for blue.
 * @type {number[]}
 */
const values_from_matrix = [
  68, 66, 64, 62, 60, 58, 57, 56, 55, 54,
  52, 48, 42, 38, 30, 29, 28, 27, 26, 22, 20, 17, 10, 4, 4, 4, 4,
  4, 4, 5, 6, 6, 5, 6, 5, 10, 11, 8, 9, 10, 10, 10, 10, 10,
  11, 15, 15, 15, 12, 15, 16, 15, 14, 16, 17, 19, 20, 21, 21, 21, 22,
  22, 22, 19, 19, 23, 20, 20, 20, 20, 20, 20, 20, 20, 20, 23, 22, 21,
  21, 21, 30, 22, 22, 23, 24, 28, 29, 26, 27, 27, 27, 27, 27, 30, 26,
  26, 29, 29, 30, 31, 28, 32, 29, 30, 30, 29, 28, 28, 31, 25, 29, 23,
  23, 21, 21, 21, 20, 23, 22, 22, 21, 20, 19, 22, 23, 20, 20, 24, 24,
  20, 20, 19, 22, 22, 22, 18, 18, 18, 18, 17, 18, 17, 17, 17, 17, 17,
  18, 18, 19, 19, 23, 20, 20, 23, 23, 24, 21, 21, 21, 21, 21, 24, 23,
  19, 18, 18, 17, 20, 16, 15, 15, 14, 13, 16, 15, 11, 10, 9, 9, 8, 11,
  7, 7, 7, 7, 8, 8, 9, 9, 10, 11, 11, 13, 14, 15,
  16, 17, 18, 19, 20, 22, 23, 25, 26, 27, 28, 29, 30, 31, 31, 31, 31,
  32, 32,
];

type Datum = {
  date: Date,
  value: number,
}

const DATE_DURATION = 398;
const FIRST_DATE = new Date('Feb 7 2020');
/**
 * There are 216 values in my matrix and 398 days from Feb 7, 2020 to March 2021.
 * Thus needs appropriate interpolation
 * @type {({date: Date, value: number}[]}
 */
const country_threat_data: Datum[] = values_from_matrix.map((value, i) => {
  const timestamp = new Date(FIRST_DATE)
    .setDate(FIRST_DATE.getDate() + i / values_from_matrix.length * DATE_DURATION);
  const date = new Date(timestamp);

  return { date, value };
});
// could not retrieve the teal values as white pixels
// also contain large green and blue pixels.
// Therefore, simulating.
const self_threat_data: Datum[] = country_threat_data.map(({ date, value }) => ({
  date,
  value: value + 60,
}));
const cell22Margin = { top: 372, right: 30, bottom: 30, left: 472 };

const cell22 = svg.select<SVGGElement>('g#cell22')
  .style('transform', `translate(${cell22Margin.left}px, ${cell22Margin.top}px)`);

// add backdrop
drawBackDrop(cell22, 125, -2, 317, 185);

const visMargin = { left: 130, top: 55 };
const visWidth = 280;
const visHeight = 180;
const visAxisPadding = { left: 15, bottom: 95 };

const cell22Vis = cell22
  .append('g')
  .attr('id', 'vis11')
  .style('transform', `translate(${visMargin.left}px, ${visMargin.top}px)`);

// Add X axis
const scaleX = (function drawXAxis() {
  const scaleX = d3.scaleTime()
    .domain([
      new Date(Math.min(...country_threat_data.map(d => d.date.valueOf()))),
      new Date(Math.max(...country_threat_data.map(d => d.date.valueOf()))),
    ])
    .range([visAxisPadding.left, visWidth]);


  const tickValues = [
    new Date('7 Feb 2020'),
    new Date('16 Apr 2020'),
    new Date('11 June 2020'),
    new Date('27 Aug 2020'),
    new Date('22 Oct 2020'),
    new Date('17 Dec 2020'),
    new Date('11 Mar 2021'),
  ];

  const xAxis = drawMonthDateAxisBottom(
    cell22,
    scaleX,
    tickValues,
    visMargin.left,
    visHeight - 32,
    BLUE,
  );

  xAxis.selectAll('text')
    .style('font-size', '6px');
  xAxis.select('.domain').remove();
  xAxis.selectAll('text')
    .each((_, index, groups) => {
      const textEl = groups[index] as SVGTextElement;
      const startDate = new Date(textEl.textContent as string);
      textEl.textContent += `-${startDate.getDate() + 3}`;
    });

  return scaleX;
})();

// Add Y axis
const scaleY = (function drawYAxis() {
  return d3.scaleLinear()
    .domain([
      Math.min(...country_threat_data.map(d => d.value), ...self_threat_data.map((d) => d.value)),
      Math.max(...country_threat_data.map(d => d.value), ...self_threat_data.map((d) => d.value)),
    ])
    .range([0, visHeight - visAxisPadding.bottom]);
})();

function drawLines(data: Datum[], color: string) {
  const tealLine = d3.line<Datum>()
    .curve(d3.curveBasisOpen)
    .x(d => scaleX(new Date(d.date)))
    .y(d => scaleY(d.value));
  cell22Vis.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', 1.5)
    .attr('d', tealLine);
}

drawLines(country_threat_data, BLUE);
drawLines(self_threat_data, TEAL);

// Draw events
const eventDescriptions = [
  {
    lines: ['UK first', 'lockdown', 'announced', '(23rd March)'],
    x: 170,
    y: 110,
  },
  {
    lines: ['3-step lockdown', 'easing plan', 'announced (10th', 'May)'],
    x: 205,
    y: 75,
  },
  {
    lines: ['3-tier system', 'introduced', '(12th October)'],
    x: 310,
    y: 77,
  },
  {
    lines: ['Third lockdown', 'introduced (6th', 'January)'],
    x: 370,
    y: 77,
  },
];

// executing in reverse order so that the second event's vertical
// line is hidden behind first event's tooltip
for (const eventDescription of eventDescriptions.reverse()) {
  const { lines, x, y } = eventDescription;
  cell22.append('path')
    .attr('d', `M ${x} 50 v 100`)
    .style('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-dasharray', '2,2');

  const height = lines.length * 6 + 4;
  const width = Math.max(...lines.map((l) => l.length)) * 2.8 + 5;

  cell22.append('path')
    .attr('fill', 'white')
    .attr('d', `M${x + 12},${y}h${width}v${height}h-${width}l-${12},-${height / 2}z`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    cell22.append('text')
      .text(line)
      .attr('x', x + 10 + width)
      .attr('y', y + i * 6 + 3)
      .style('font-size', '6px')
      .style('text-anchor', 'end')
      .style('alignment-baseline', 'hanging')
      .style('font-weight', 'bold');
  }
}

const drawText = makeDrawText(cell22);

drawCellTitle([['THREAT', 15]], drawText);

const lines = [
  ['The proportion saying', 45],
  ['that things feel out of', 60],
  ['control is falling fast', 75],
] as const;

drawCellSubtitle(lines, drawText);

const visDescriptions = [
  'What level of threat do you thing the coronavirus poses to...',
];

const yExpr = (i: number): number => 10 + i * 12;

drawVisDescription(visDescriptions, visMargin.left, yExpr, drawText);

const visLegends = [
  ['% ‘very high′ +', 40],
  ['‘high′ threat', 50],
] as const;
for (let i = 0; i < visLegends.length; i++) {
  let [line, y] = visLegends[i];
  drawText(line, BLUE, visMargin.left, y - 15, '7px')
    .style('font-weight', '700');
}

const valueLabels = [
  ['9%', -10, 130, TEAL],
  ['19%', -15, 85, BLUE],
  ['25%', 250, 110, TEAL],
  ['58%', 250, 70, BLUE],
] as const;

for (let valueLabel of valueLabels) {
  const [label, x, y, color] = valueLabel;
  drawText(label, color, x + 150, y, '10px')
    .style('font-weight', 'bold');
}

// Draw legends
const legendLines = [
  ['Your country', BLUE, 200],
  ['You personally', TEAL, 300],
] as const;

for (let i = 0; i < legendLines.length; i++) {
  const [line, color, x] = legendLines[i];
  drawText(line, color, x, 175, '10px');
  cell22.append('rect')
    .attr('fill', color)
    .attr('x', x - 7)
    .attr('y', 170)
    .attr('width', 5)
    .attr('height', 5);
}
