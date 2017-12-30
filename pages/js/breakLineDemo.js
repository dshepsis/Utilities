'use strict';
const getEleById = (id)=>document.getElementById(id);

const inputEle = getEleById('code-to-break');
const outputEle = getEleById('output');

inputEle.addEventListener('input', (e)=>{
  outputEle.innerText = breakLine(inputEle.value);
}, false);

function highlightContents(elem){
  const range = document.createRange();
  range.selectNodeContents(elem);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
outputEle.addEventListener('click', (e)=>{
  highlightContents(e.target);
}, false);
