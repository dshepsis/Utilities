const TextBoxResizer = (()=>{
  const TRBL = ['Top', 'Right', 'Bottom', 'Left'];
  function TRBLString(str, suffix = '') {
    return TRBL.map(dir => str + dir + suffix);
  }
  const stylesThatAffectWidth = [
    'fontSize', 'fontFamily', 'fontStyle', 'fontVariant', 'fontWeight',
    'lineHeight', 'textIndent', 'boxSizing',
    ...TRBLString('margin'), ...TRBLString('padding'),
    ...TRBLString('border', 'Width'), ...TRBLString('border', 'Style')
  ];
  class TextBoxResizer {
    constructor(element) {
      this.element = element;
      this.computedStyles = window.getComputedStyle(element);
      this.measurer = document.createElement('span');
      this.measurerText = document.createTextNode('');
      this.measurer.appendChild(this.measurerText);
      this.measurerStyle = this.measurer.style;
      Object.assign(this.measurerStyle, {
        visibility: 'hidden',
        whiteSpace: 'pre',
        position: 'fixed',
        top: '0', left: '0'
      });
      document.body.appendChild(this.measurer);
      element.addEventListener('keydown', ()=>{
        window.requestAnimationFrame(()=>this.resize());
      });
    }
    updateMeasurer() {
      this.measurerText.data = this.element.value || '\u200B';
      for (const style of stylesThatAffectWidth) {
        this.measurerStyle[style] = this.computedStyles[style];
      }
      return this;
    }
    measure() {
      return this.measurer.getBoundingClientRect();
    }
    resize() {
      this.updateMeasurer();
      const measurement = this.measure();
      const targetStyle = this.element.style;
      targetStyle.width = `${measurement.width + 1}px`;
      targetStyle.height = `${measurement.height}px`;
      return this;
    }
  }
  Object.assign(TextBoxResizer, {stylesThatAffectWidth});
  return TextBoxResizer;
})();

const text = document.createElement('input');
text.type = 'text';
const baseStyle = text.style;
baseStyle.outline = 'none';
baseStyle.border = '2px solid gray';
baseStyle.fontSize = '24px';
baseStyle.minWidth = '100px';
baseStyle.width = '100px';
baseStyle.maxWidth = '600px';
baseStyle.padding = '10px';
document.body.appendChild(text);
const re = new TextBoxResizer(text);

/* Make the measurer visible for clarity: */
Object.assign(re.measurerStyle, {
  visibility: 'visible',
  top: '61px',
  left: '8px',
  borderColor: 'black'
});
