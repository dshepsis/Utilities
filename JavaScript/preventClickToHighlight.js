/* Prevents text-highlighting caused by double/triple-clicking on an element.
 * Click and drag still works, however. This is useful if you have an element
 * which contains text, but also has some click functionality, so that the user
 * is not annoyed by accidentally highlighting text when they simply meant to
 * repeatedly fire the click event. */
function preventClickToHighlight(element) {
  function blockMultipleMouseDownEvent(event) {
    if (event.detail > 1) {
      event.preventDefault();
    }
  }
  element.addEventListener("mousedown", blockMultipleMouseDownEvent);
  return element;
}
