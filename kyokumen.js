/**
 * kyokumen.js: A library for shogi documents on the web
 * Author:      Jun Koda (2016)
 * Website:     https://github.com/junkoda/kyokumen
 */

if (typeof kyokumenJs == 'undefined') {
kyokumenJs = {
  ver: '0.0.2',
  senteMark: '☗',
  goteMark: '☖',

main: function() {

window.addEventListener('load', eventWindowLoaded, false);

const nrow = 9;
const Piece = { l:'香', n:'桂', s:'銀', g:'金', k:'玉', r:'飛', b:'角', p:'歩', '+l':'成香', '+n':'成桂', '+s':'成銀', '+r':'龍', '+b':'馬', '+p':'と'};
const numKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八'];

const defaultCSS = 'https://junkoda.github.io/kyokumen/' + kyokumenJs.ver + '/kyokumen.css';

loadDefaultCSS(defaultCSS);

function eventWindowLoaded() {
  createKyokumens();
  setupMoves();
}

/**
 * Find all tags with class='kyokumen-svg' and create the kyokumen SVG elements
 */
function createKyokumens() {
  var kyokumenFigs = document.getElementsByClassName('kyokumen');

  var n = kyokumenFigs.length;
  for (var i = 0; i < n; i++) {
    //var kyokumenSvg = getKyokumenSvg(kyokumenFig) || createKyokumenSvg(kyokumenFig);

    kyokumenFigs[i].addEventListener('click', drawMove, false);
    createKyokumen(kyokumenFigs[i]);
  }
}

/**
 * Return existing kyokumen SVG in the given fig
 */
function getKyokumenSvg(kyokumenFig)
{
  var kyokumenSvgs = kyokumenFig.getElementsByClassName('kyokumen-svg');

  if (kyokumenSvgs.length == 0)
    return false;

  if (kyokumenSvgs.length > 1)
    console.log('Error: more than one kyokumen-svg in a figure');

  return kyokumenSvgs[0];
}

/**
 * Create a new SVG node in given fig
 */
function createKyokumenSvg(fig) {
  var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('class', 'kyokumen-svg');

  var figId = fig.getAttribute('id');
  if (figId) {
    s.setAttribute('id', figId + '-svg');
  }

  fig.appendChild(s);

  return s;
}

/**
 * Find all tags with class='mv' and attach event listener drawMove
 */
function setupMoves() {
  var moves = document.getElementsByClassName('mv');
  var n = moves.length;
  for (var i = 0; i < moves.length; i++) {
    moves[i].addEventListener('mouseover', drawMove, false);
  }
}

/**
 *Variables:
 * *kyokumen* is an <figure> tag with class='kyokumen' and an sfen attribute
 * e.g.: <figure id='fig1' class='kyokumen'
 *         sfen='lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b 1'>
 *       </figure>
 * *width*is the width of the svg element, which is the length in pixcels
 */

function createKyokumen(kyokumenFig) {
  var kyokumen = createKyokumenSvg(kyokumenFig);
  var width = getWidth(kyokumenFig, kyokumen);
  var margin = getPadding(kyokumenFig, kyokumen);
  var sfen = kyokumenFig.getAttribute('data-sfen');
  var sente = kyokumenFig.getAttribute('data-sente');
  var gote = kyokumenFig.getAttribute('data-gote');
    
  kyokumen.style.width = String(width + margin[1] + margin[3]) + 'px';
  kyokumen.style.height = String(width + margin[0] + margin[2]) + 'px';
  kyokumen.style.padding = '0';

  // Save original value of width and margin as w and mar respectively
  kyokumenFig.setAttribute('data-width', width);
  kyokumenFig.setAttribute('data-padding', margin);

  drawBan(kyokumen, width, margin);        // Box and lines
  drawNumbersCol(kyokumen, width, margin); // Axis label ９、８、･･･、１
  drawNumbersRow(kyokumen, width, margin); // Axis label 一、二、･･･、九
  drawPieces(kyokumen, width, margin, sfen, sente, gote);
}

/**
 * Draw move
 */
function drawMove() {
  /**
   * @this is a class='mv' tag width board='board id' and sfen
   */

  var kyokumenFig = getFig(this);
  if (!kyokumenFig) return;

  var sfen = this.getAttribute('data-sfen');
  if (!sfen) {
    console.log('Error: unable to get sfen in move:');
    console.log(this);
  }

  var sente = this.getAttribute('data-sente') || kyokumenFig.getAttribute('data-sente');
  var gote = this.getAttribute('data-gote') || kyokumenFig.getAttribute('data-gote');

  var kyokumen = getKyokumenSvg(kyokumenFig);

  // Remove existing pieces
  clearKyokumen(kyokumen, 'koma');
  clearKyokumen(kyokumen, 'nari-goma');
  clearKyokumen(kyokumen, 'sente');
  clearKyokumen(kyokumen, 'gote');

  var width = getWidth(kyokumenFig, kyokumen);
  var margin = getPadding(kyokumenFig, kyokumen);

  drawPieces(kyokumen, width, margin, sfen, sente, gote);
}

/**
 * Remove class=cls child elements from kyokumen
 * Args:
 *     kyokumen: a DOM element
 *     cls (string): class name 'koma', 'nari-goma', ...
 */
function clearKyokumen(kyokumen, cls) {
  var komas = kyokumen.getElementsByClassName(cls);
  while (komas.length > 0) {
    kyokumen.removeChild(komas[0]);
    komas = kyokumen.getElementsByClassName(cls);
  }
}



/**
 * Draw a square and lines for shogi-ban
 */
function drawBan(kyokumen, width, margin) {
  var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('class', 'ban');
  rect.setAttribute('x', margin[3]);
  rect.setAttribute('y', margin[0]);
  rect.setAttribute('width', width);
  rect.setAttribute('height', width);
  kyokumen.appendChild(rect);

  var w = width / nrow;

  // 横線
  for (var i = 1; i < nrow; i++) {
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'sen');
    line.setAttribute('x1', margin[3]);
    line.setAttribute('x2', margin[3] + width);
    line.setAttribute('y1', margin[0] + w * i);
    line.setAttribute('y2', margin[0] + w * i);
    kyokumen.appendChild(line);
  }

  // 縦線
  for (var i = 1; i < nrow; i++) {
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', margin[3] + w * i);
    line.setAttribute('x2', margin[3] + w * i);
    line.setAttribute('class', 'sen');
    line.setAttribute('y1', margin[0]);
    line.setAttribute('y2', margin[0] + width);
    kyokumen.appendChild(line);
  }
}

/**
 *  Draw 9 ... 1 on top magin
 */
function drawNumbersCol(kyokumen, width, margin) {
  const offsetNumCol = kyokumenJs.offsetNumCol || 0.26;

  var w = width / nrow;
  label = ['９', '８', '７', '６', '５', '４', '３', '２', '１'];

  for (var i = 0; i < nrow; i++) {
    var num = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    num.setAttribute('class', 'num');
    num.setAttribute('x', margin[3] + w * (i + 0.5));
    num.setAttribute('y', margin[0] - w*offsetNumCol); // + -w * axisLine - 2);


    num.setAttribute('text-anchor', 'middle');
    //num.setAttribute('dominant-baseline', 'middle');
    var text = document.createTextNode(label[i]);
    num.appendChild(text);
    kyokumen.appendChild(num);
  }
}

/**
 *  Draw 一、二、･･･、九 on left margin
 */
function drawNumbersRow(kyokumen, width, margin) {
  const offsetNumRow = kyokumenJs.offsetNumRow || 0.55;
  var w = width / nrow;

  for (var i = 0; i < nrow; i++) {
    var num = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    num.setAttribute('class', 'num');
    num.setAttribute('x', margin[3] + width + w*offsetNumRow);
    num.setAttribute('y', margin[0] + w * (i + 0.5));

    num.setAttribute('text-anchor', 'middle');
    //num.setAttribute('dominant-baseline', 'central');text-before-edge
    //num.setAttribute('dominant-baseline', 'text-before-edge');
    num.setAttribute('dominant-baseline', 'central');
    var text = document.createTextNode(numKanji[i]);
    num.appendChild(text);
    kyokumen.appendChild(num);
  }
}

/**
 * Parse sfen string and draw pieces
 */
function drawPieces(kyokumen, width, margin, sfen, sente, gote) {
  // e.g. sfen='lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b'>
  // for example for initial

  var w = width / nrow;
  var n = sfen.length;
  var ix = 0;
  var iy = 0;

  // Pices on board
  var i;
  for (i = 0; i < n; i++) {
    p = sfen.charAt(i);
    if (p == '+') {
      p = sfen.substring(i, i + 2);
      i++;
    }

    var number = Number(p);
    if (p == '/') { // Next row
      ix = 0;
      iy++;
    }
    else if (number) { // n black squares
      ix += number;
    }
    else if (p == ' ') { // End of board discription
      break;
    }
    else {
      drawPiece(kyokumen, margin, w, ix, iy, p);
      ix++;
    }
  }

  i = skipTeban(sfen, i);

  i = DrawSente(kyokumen, width, margin, sfen, sente, i);
  i = DrawGote(kyokumen, width, margin, sfen, gote, i);
}

/**
 * Draw one piece
 * Args:
 *       w:  width / nrow
 *       ix: 0...9, column index
 *       iy: 0...9, row index
 *       p:  sfen character 'p', 'P', ..., or promoted '+p', '+P', ..
 */
function drawPiece(kyokumen, margin, w, ix, iy, p) {
  var pieceText = Piece[p.toLowerCase()];

  if (pieceText) {
    var x = margin[3] + w * (ix + 0.5);
    var y = margin[0] + w * (iy + 0.5);
    var piece = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    if (p.charAt(0) == '+') {
      piece.setAttribute('class', 'nari-goma');
    }
    else {
      piece.setAttribute('class', 'koma');
    }

    piece.setAttribute('x', x);
    piece.setAttribute('y', y);

    if (isGote(p)) {
      // Rotate Gote's piece
      var transformation = 'translate(' + String(x) + ' ' + String(y) + ') ';
      if (pieceText.length == 2) {
        // Shrink the height of Gote's 成香、成桂、成銀
        transformation += ' scale(1.0 0.5)';
      }
      transformation += 'rotate(180)';
      transformation += 'translate(' + String(-x) + ' ' + String(-y) + ') ';

      piece.setAttribute('transform', transformation);
    }
    else if (pieceText.length == 2) {
      // Shrink the height of Sente's 成香、成桂、成銀
      var transformation = 'translate(' + String(x) + ' ' + String(y) + ') ';
      transformation += ' scale(1.0 0.5)';
      transformation += 'translate(' + String(-x) + ' ' + String(-y) + ') ';
      piece.setAttribute('transform', transformation);
    }

    piece.setAttribute('text-anchor', 'middle');
    piece.setAttribute('dominant-baseline', 'central');
    var text = document.createTextNode(pieceText);

    piece.appendChild(text);
    kyokumen.appendChild(piece);
  }
  else {
    console.log('Error: unknown piece, ' + p);
  }
}

/**
 * Returns true if the character is lower case.
 * True for 'p', '+p', 'l', ...
 * False for 'P', '+P', 'L', ...
 */
function isGote(character) {
  return (character == character.toLowerCase());
}

/**
 * Skip [space]b or w[space] in sfen string sfen[i] and later
 * Args:
 *     sfen (str): sfen string
 *     i (int): position of character to analysis
 * Returns:
 *     index i after [space]b/w[space]
 */
function skipTeban(sfen, i) {
  var n = sfen.length;
  while (i < n) {
    p = sfen.charAt(i);
    if (p == ' ')
      i++;
    else if (p == 'b' || p == 'w') {
      i++;
    }
    else
      break;
  }
  return i;
}

/**
 * Draw <svg sente='☗先手'> atrribute with Sente's pieces in hand.
 */
function DrawSente(kyokumen, width, margin, sfen, sente, i) {
  const w = width/nrow;
  var n = sfen.length;

  if (!sente)
    sente = ' 先手 ';
  else
    sente = ' ' + sente + ' ';

  while (i < n) {
    var p = sfen.charAt(i);
    number = parseInt(sfen.substring(i, n));
    if (number) {
      sente += numKanji[number - 1];
      i += String(number).length;
    }
    else if (isGote(p)) {
      break;
    }
    else {
      sente += Piece[p.toLowerCase()];
      i++;
    }
  }

  var komark = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
  komark.setAttribute('class', 'komark');
  komark.appendChild(document.createTextNode(kyokumenJs.senteMark));


  var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('class', 'sente');
  label.setAttribute('x', margin[3] + width + w + (margin[1] - w)/2);
  //label.setAttribute('x', margin[1] + (1 + 1.5 / nrow) * width + 4);
  label.setAttribute('y', margin[0]);
  label.setAttribute('dominant-baseline', 'central');
  var text = document.createTextNode(sente);
  label.appendChild(komark);
  label.appendChild(text);
  kyokumen.appendChild(label);

  return i;
}

/**
 * Draw <svg gote='☖後手'> attribute with Gote's pieces in hand.
 */
function DrawGote(kyokumen, width, margin, sfen, gote, i) {
  var n = sfen.length;
  //var gote = ' ' + kyokumen.getAttribute('data-gote');
  if (!gote)
    gote = ' 後手 ';
  else
    gote = ' ' + gote + ' ';

  while (i < n) {
    var p = sfen.charAt(i);
    if (p == ' ') break;

    number = parseInt(sfen.substring(i, n));
    if (number) {
      gote += numKanji[number - 1];
      i += String(number).length;
    }
    else {
      gote += Piece[p.toLowerCase()];
      i++;
    }
  }

  var komark = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
  komark.setAttribute('class', 'komark');
  komark.appendChild(document.createTextNode(kyokumenJs.goteMark));

  var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('class', 'gote');
  label.setAttribute('x', margin[3]/2);
  label.setAttribute('y', margin[0]);
  label.setAttribute('dominant-baseline', 'central');
  var text = document.createTextNode(gote);
  label.appendChild(komark);
  label.appendChild(text);
  kyokumen.appendChild(label);

  return i;
}

function getWidth(kyokumenFig, kyokumenSvg) {
  var owidth = kyokumenFig.getAttribute('data-width');
  if (owidth) {
    return Number(owidth);
  }

  var strWidth = document.defaultView.getComputedStyle(kyokumenSvg, null).width;
  var width = parseFloat(strWidth);

  if (!width) {
    console.log('Error in width: ' + strWidth);
    return undefined;
  }

  return width;
}

function getPadding(kyokumenFig, kyokumenSvg) {
  /**
   *  top-bottom left-right
   *  top right-left bottom
   *  top right botton left
   */

  var omargin = kyokumenFig.getAttribute('data-padding');
    
  if (omargin) {
    return omargin.split(',').map(Number);
  }

  var margin = [0, 0, 0, 0];

  style = document.defaultView.getComputedStyle(kyokumenSvg, null)

  margin[0] = parseFloat(style.paddingTop);
  margin[1] = parseFloat(style.paddingRight);
  margin[2] = parseFloat(style.paddingBottom);
  margin[3] = parseFloat(style.paddingLeft);

  return margin;
}

/**
  * Return <figure class="kyokumen"> object -- kyokumenFig
  * When o is a class="mv", return the kyokumenFig specified by the 'data-board' attr
  * When o is itself a figure opject return o.
  */
function getFig(o) {
  if (o.tagName == 'FIGURE')
    return o;

  var boardid = o.getAttribute('data-board');

  var kyokumenFig = document.getElementById(boardid);
  if (!kyokumenFig) {
    console.log('Error: board not found with id= ' + boardid);
    return;
  }

  return kyokumenFig;
}

/*
function getBoard(o) {
  if (o.tagName == 'svg')
    return o;

  var boardid = o.getAttribute('data-board');
  if (!boardid) {
    console.log('Error: attribute board not defined');
    console.log(o);
    return;
  }

  boardid = boardid + '-svg';

  var kyokumen = document.getElementById(boardid);
  if (!kyokumen) {
    console.log('Error: board not found with id= ' + boardid);
    return;
  }


  return kyokumen;
}
*/

function loadDefaultCSS(filename)
{
  var link = document.createElement('link');
  link.href = filename;
  link.type = "text/css";
  link.rel = "stylesheet";

  head = document.getElementsByTagName('head')[0];

  firstlink = head.getElementsByTagName('link')[0];
  if (firstlink) {
    head.insertBefore(link, firstlink)
  }
  else {
    head.appendChild(link); 
  }
}

}}

kyokumenJs.main();
}

