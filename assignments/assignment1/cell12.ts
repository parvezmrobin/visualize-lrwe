import * as d3 from 'd3';
import {
  BLUE,
  GREY,
  svg,
  TEAL,
} from './util';


const cell12Margin = { top: 190, right: 30, bottom: 30, left: 470 };

const group12 = svg.select<SVGGElement>('g#cell12')
  .style('transform', `translate(${cell12Margin.left}px, ${cell12Margin.top}px)`);
console.assert(!group12.empty());

// add backdrop
group12.append('rect')
  .attr('x', 128)
  .attr('y', -20)
  .attr('width', 315)
  .attr('height', 185)
  .attr('fill', GREY);

const visMargin = { left: 130, top: 20 };

const group21Viz = group12
  .append('g')
  .attr('id', 'vis21')
  .style('transform', `translate(${visMargin.left}px, ${visMargin.top}px)`);


function drawText(
  text: string, color: string, x: number, y: number, fontSize: string,
): d3.Selection<SVGTextElement, unknown, HTMLElement, any> {
  return group12.append('text')
    .text(text)
    .attr('fill', color)
    .style('font-size', fontSize)
    .style('transform', `translate(${x}px, ${y}px)`);
}

for (const line of [['HOME TESTING', 0], ['STUDY', 15]] as const) {
  const [text, y] = line;
  drawText(text, 'white', 5, y, '14px')
    .style('font-weight', '700');
}

const headerDescription = [
  'The largest testing',
  'programme for',
  'coronavirus shows a',
  'decline in prevalence',
  'of the virus',
];

for (let i = 0; i < headerDescription.length; i++) {
  const line = headerDescription[i];
  drawText(line, 'white', 5, i * 13 + 30, '11px');
}

const visDescriptionLines = [
  ['COVID-19 home testing study over time', 0],
] as const;
for (let line of visDescriptionLines) {
  const [text, y] = line;
  drawText(text, BLUE, 135, y - 5, '9px');
}

const images = [[40, 'blue'], [40, 'teal'], [60, 'darkblue']] as const;
for (let i = 0; i < images.length; i++) {
  let [h, color] = images[i];
  group21Viz.append('image')
    .attr('href', `/assignment1/assets/person-${color}.svg`)
    .style('height', `${h}px`)
    .style('transform', `translate(${i * 100}px, ${35 - h}px)`);
}

let descriptionLines = [
  {
    color: BLUE,
    lines: [
      '60 people',
      'infected in',
      'every 10,000 in',
      'September -',
      'October 2020',
    ],
  },
  {
    color: TEAL,
    lines: [
      '157 people in',
      'every 10,000',
      'infected in ',
      'January 2021',
    ],
  },
  {
    color: '#204D4D',
    lines: [
      '49 people in',
      'every 10,000',
      'infected in ',
      'February 2021',
    ],
  },
];

for (let j = 0; j < descriptionLines.length; j++){
  let description = descriptionLines[j];
  const { color} = description;
  for (let i = 0; i < description.lines.length; i++) {
    let line = description.lines[i];
    drawText(line, color, 138 + j * 100, i * 12 + 70, '10px');
  }
}

for (let i = 0; i < 2; i++) {
  group21Viz.append('image')
    .attr('href', `/assignment1/assets/right-arrow-thick.svg`)
    .style('height', `22px`)
    .style('transform', `translate(${i * 100 + 80}px, 45px)`);
}

const bottomInfo = group12.append('text')
  .style('transform', 'translate(135px, 140px)')
  .style('font-size', '7px')
  .style('fill', BLUE)
  .style('font-weight', 'bold')
  .node() as SVGTextElement;

bottomInfo.innerHTML = '165,456 swab results between ' +
  '4<tspan style="font-size: 5px" baseline-shift="super">th</tspan> ' +
  'and 23<tspan style="font-size: 5px" baseline-shift="super">rd</tspan> ' +
  'February. 689 tested positive for COVID-19';

const bottomLink = group12.append('text')
  .style('transform', 'translate(135px, 152px)')
  .style('font-size', '7px')
  .style('fill', BLUE)
  .node() as SVGTextElement;

bottomLink.innerHTML = 'Find out more here: ' +
  '<tspan style="fill: #0564C2; text-decoration: underline">https://www.ipsos.com/ipsos-mori/en-uk/final-findings-latest-covid-19-react-1-</tspan>';

const bottomLink1 = group12.append('text')
  .style('transform', 'translate(135px, 160px)')
  .style('font-size', '7px')
  .style('fill', BLUE)
  .node() as SVGTextElement;

bottomLink1.innerHTML = '<tspan style="fill: #0564C2; text-decoration: underline">study-published</tspan>';
