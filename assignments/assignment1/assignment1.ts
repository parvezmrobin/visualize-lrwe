import * as d3 from 'd3';

import '../src/style.css';
import './assignment1.scss';


import './cell11';
import './cell12';
import './cell21';
import './cell22';
import './cell31';
import './cell32';

const modalDiv = document.createElement('div');
document.body.append(modalDiv);

const d3Modal = d3.select(modalDiv)
  .style('position', 'fixed')
  .style('z-index', 100)
  .style('top', '200px')
  .style('left', '200px')
  .style('padding', '5px')
  .style('border-radius', '2px')
  .style('background-color', '#2B547E')
  .attr('hidden', 'hidden');
const inputElement = d3Modal.append('input')
  .attr('type', 'color')
  .node() as HTMLInputElement;
d3Modal.append('label')
  .text('Choose a color')
  .style('color', 'white')
  .style('padding-right', '5px');

let isModalHidden = true;
let currentTarget: d3.Selection<SVGElement, unknown, null, undefined> | undefined;
let colorAttr: 'fill' | 'stroke';

d3.selectAll(':not([fill],[stroke],input)')
  .on('click', (e) => {
    e.stopPropagation();
    if (isModalHidden) {
      return;
    }

    d3Modal.attr('hidden', 'hidden');
    isModalHidden = true;
    currentTarget = undefined;
  })

d3.selectAll('[fill],[stroke]')
  .on('click', (e: MouseEvent) => {
    e.stopPropagation();
    const targetEl = e.target as SVGElement;
    const fillColor = targetEl.getAttribute('fill');
    const strokeColor = targetEl.getAttribute('stroke');
    if (fillColor && fillColor !== 'none') {
      inputElement.value = fillColor;
      // d3Input.attr('value', fillColor);
      colorAttr = 'fill';
    } else if (strokeColor && strokeColor !== 'none') {
      inputElement.value = strokeColor;
      // d3Input.attr('value', strokeColor);
      colorAttr = 'stroke';
    } else {
      return;
    }

    currentTarget = d3.select(targetEl);
    if (isModalHidden) {
      d3Modal.attr('hidden', null);
      isModalHidden = false;
    }

    const elementPosition = targetEl.getBoundingClientRect();
    d3Modal.style('top', `${elementPosition.top - 50}px`)
      .style('left', `${elementPosition.left}px`);

    setTimeout(() => inputElement.click(), 100);
  });


inputElement.addEventListener('click', e => {
  e.stopPropagation();
})

inputElement.addEventListener('input', () => {
  if (currentTarget === undefined) {
    console.error('Current target is empty on color input');
    return;
  }
  currentTarget.attr(colorAttr, inputElement.value);
});
