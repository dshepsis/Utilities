'use strict';
const getEleById = (id)=>document.getElementById(id);

const inputEle = getEleById('code-to-break');
const outputEle = getEleById('output');

inputEle.addEventListener('input', (e)=>{
  console.log(breakLine(inputEle.innerHTML));
  outputEle.innerText = breakLine(inputEle.value) + "\n";
}, false);

function highlightContents(elem){
  //var elem = document.getElementById("utput");
  var range = document.createRange();
  range.selectNodeContents(elem);
  var selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
outputEle.addEventListener('click', (e)=>{
  highlightContents(e.target);
}, false);
