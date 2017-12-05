function loadDefaultCSS(filename) {
  var link = document.createElement('link');
  link.href = filename;
  link.type = 'text/css';
  link.rel = 'stylesheet';

  let head = document.getElementsByTagName('head')[0];

  let firstlink = head.getElementsByTagName('link')[0];
  if (firstlink) {
    head.insertBefore(link, firstlink);
  }
  else {
    head.appendChild(link);
  }
}

/*
 * Main function for default use
 */
function main() {
  window.addEventListener('load', eventWindowLoaded, false);

  const defaultCSS = 'https://junkoda.github.io/kyokumen/' + kyokumenJs.ver + '/kyokumen.css';

  loadDefaultCSS(defaultCSS);

  function eventWindowLoaded() {
    setup(document.body, null);
  }

  /**
   * Traverse DOM and setup kyokumen and moves
   */
  function setup(node, fig) {
    if ((node.children || []).nodeType === 1)
      return fig;

    if (node.className === 'kyokumen') {
      fig = node;
      let kyokumen = createKyokumen(fig);
      kyokumen.svg.addEventListener('click', () => kyokumen.reset(), false);
    } else if (node.className === 'mv') {
      var mv = createMv(node, fig);
      if (mv)
        node.addEventListener('mouseover', () => mv.draw(), false);
      else
        console.log('Error: unable to create mv in tab', mv);
    } else {
      for (var i = 0; i < node.children.length; i++)
        fig = setup(node.children[i], fig);
    }

    return fig;
  }
}

main();
