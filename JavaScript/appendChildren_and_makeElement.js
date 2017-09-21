/* A function for appending an array of children to a parent HTMLElement: */
function appendChildren (parent, children) {
  function appendItem(item) {
    if (item instanceof HTMLElement) {
      parent.appendChild(item);
    } else {
      let text = document.createTextNode(String(item));
      parent.appendChild(text);
    }
  }

  if (Array.isArray(children)) {
    for (let i = 0, len = children.length; i < len; ++i) {
      appendItem(children[i]);
    }
  } else {
    appendItem(children);
  }
}

/**
 * Makes an HTML element with content. This is similar to the
 * document.createElement() method, but allows text or other elements to be
 * added as children in-place. The optional attrObj parameter allows for
 * attributes such as id, class, src, and href to also be specified in-place.
 *
 * For example:
 * > makeElement("p", "Hello world!");
 * <p>Hello world!</p>
 *
 * > makeElement("span", 3.14);
 * <span>3.14</span>
 *
 * > makeElement("a", "FAQ", {href:"/faq.html"})
 * <a href="/faq.html">FAQ</a>
 *
 * The equivalent using default tools is much longer, and takes at least 2 lines:
 * > let ele = document.createElement("p");
 * > ele.appendChild(document.createTextNode("Hello world!"));
 *
 * makeElement be used without specifying the content parameter, in which case
 * it becomes equivalent to document.createElement.
 *
 * More importantly, the content attribute can be another HTMLElement, in which
 * case the element is appended directly to the newly created element.
 *
 * For example,
 * > let item = makeElement("li", "Get eggs");
 * > makeElement("ul", item)
 * <ul><li>Get eggs</li></p>
 *
 * You can even chain the methods together directly, without intermediate
 * variables:
 * > makeElement("ul", makeElement("li", "Get milk"));
 * <ul><li>Get milk</li></p>
 *
 * If content is an array, then each item will be individually appended using
 * the same logic as for a single piece of content:
 *
 * > let ingredients = ["Milk", "Eggs", "Flour"];
 * > let eles = ingredients.map((ingredient)=>makeElement("li", ingredient));
 * > makeElement("ul", eles);
 * <ul><li>Milk</li><li>Eggs</li><li>Flour</li></ul>
 */
function makeElement(type, content, attrObj) {
  /* The new element being populated: */
  let newEle = document.createElement(type);

  /* If no content parameter was passed, leave the element childless. Otherwise,
   * add the content (array or single item) to newEle: */
  if (content !== undefined) {
    appendChildren(newEle, content)
  }

  /* Apply information from the attributes object: */
  if (attrObj !== undefined) {
    for (let attribute in attrObj) {
     newEle.setAttribute(attribute, attrObj[attribute]);
    }
  }
  return newEle;
}
