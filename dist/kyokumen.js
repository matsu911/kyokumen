;(function() {
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * kyokumen.js: A library for shogi documents on the web
 * Author:      Jun Koda (2016)
 * Website:     https://github.com/junkoda/kyokumen
 */

var kyokumenJs = {
    ver: '0',
    senteMark: '☗',
    goteMark: '☖',
    maxDuplicate: 3,
    handOffset: 0.1,
    offsetNumCol: 0.26,
    offsetNumRow: 0.55
};

var nrow = 9;
var Piece = { l: '香', n: '桂', s: '銀', g: '金', k: '玉', r: '飛', b: '角', p: '歩', '+l': '成香', '+n': '成桂', '+s': '成銀', '+r': '龍', '+b': '馬', '+p': 'と' };
var numKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八'];

/*
 * API of kyokumen.js usable by other codes
 */
kyokumenJs.createKyokumen = createKyokumen; // create a kyokumen in figure
kyokumenJs.Kyokumen = function (svg, width, margin) {
    var kyokumen = new Kyokumen(svg, width, margin, '');

    drawBan(svg, width, margin); // Box and lines
    drawNumbersCol(svg, width, margin); // Axis label ９、８、･･･、１
    drawNumbersRow(svg, width, margin); // Axis label 一、二、･･･、九

    kyokumen.draw();

    return kyokumen;
};

/**
 * s (str): string of two numbers '12'
 * Returns: array [1, 2]
 */
function parseCoordinate(s) {
    if (typeof s === 'string') {
        if (s.length != 2) {
            console.log('Error: data-made must have two integers', s);
            return null;
        }
        var ix = parseInt(s[0]);
        var iy = parseInt(s[1]);

        if (ix && iy) return [ix, iy];
    }

    return null;
}

/**
 * kyokumen object constructor
 */

var Kyokumen = function () {
    function Kyokumen(svg, width, margin, sfen, sente, gote, title, focus) {
        _classCallCheck(this, Kyokumen);

        this.svg = svg;
        this.width = width;
        this.margin = margin;
        this.sfen = sfen;
        this.sente = sente;
        this.gote = gote;
        this.title = title;
        this.focus = parseCoordinate(focus);
    }

    _createClass(Kyokumen, [{
        key: 'clear',
        value: function clear() {
            this.clearKyokumen('koma');
            this.clearKyokumen('nari-goma');
            this.clearKyokumen('sente');
            this.clearKyokumen('gote');
            this.clearKyokumen('title');
        }
    }, {
        key: 'clearKyokumen',


        /**
         * Remove class=cls child elements from kyokumen
         * Args:
         *     kyokumen: a DOM element
         *     cls (string): class name 'koma', 'nari-goma', ...
         */
        value: function clearKyokumen(cls) {
            var komas = this.svg.getElementsByClassName(cls);
            while (komas.length > 0) {
                this.svg.removeChild(komas[0]);
                komas = this.svg.getElementsByClassName(cls);
            }
        }
    }, {
        key: 'draw',
        value: function draw(sfen, sente, gote, title, focus) {
            if (sfen == undefined) {
                sfen = sfen || this.sfen;
                sente = sente || this.sente;
                gote = gote || this.gote;
                title = title || this.title;
                focus = focus || this.focus;
            }

            this.clear();
            this.drawTitle(title);
            this.drawPieces(sfen, sente, gote, focus);
        }
    }, {
        key: 'isGote',


        /**
         * Returns true if the character is lower case.
         * True for 'p', '+p', 'l', ...
         * False for 'P', '+P', 'L', ...
         */
        value: function isGote(c) {
            return c == c.toLowerCase();
        }
    }, {
        key: 'senteLabel',
        value: function senteLabel(name) {
            var w = this.width / nrow;
            var x = this.margin[3] + this.width + w + (this.margin[1] - w) / 2;
            var y = this.margin[0] + this.width - kyokumenJs.handOffset * w;
            var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('class', 'sente');
            label.setAttribute('x', x);
            label.setAttribute('y', y);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('dominant-baseline', 'central');
            if (!name) name = ' 先手 ';else name = ' ' + name + ' ';
            label.appendChild(this.komark(kyokumenJs.senteMark));
            label.appendChild(document.createTextNode(name));
            return label;
        }
    }, {
        key: 'goteLabel',
        value: function goteLabel(name) {
            var x = this.margin[3] / 2;
            var y = this.margin[0];
            var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('class', 'gote');
            label.setAttribute('x', x);
            label.setAttribute('y', y);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('dominant-baseline', 'central');
            label.setAttribute('transform', 'rotate(180 ' + x + ' ' + y + ')');

            if (!name) name = ' 後手 ';else name = ' ' + name + ' ';
            label.appendChild(this.komark(kyokumenJs.goteMark));
            label.appendChild(document.createTextNode(name));

            return label;
        }

        /**
         * Draw <svg sente='☗先手'> atrribute with Sente's pieces in hand.
         */

    }, {
        key: 'drawSente',
        value: function drawSente(sfen, name, i) {
            var n = sfen.length;
            var label = this.senteLabel(name);
            var iPiece = 0;
            var tspan = function tspan(p, i) {
                var pt = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                pt.appendChild(document.createTextNode(Piece[p.toLowerCase()]));
                pt.setAttribute('class', 'sente-piece-hand');
                pt.setAttribute('data-i', i);
                pt.setAttribute('data-p', p.toLowerCase());
                return pt;
            };
            while (i < n) {
                var p = sfen.charAt(i);
                if (p === '-' || p === ' ') break;

                var number = parseInt(sfen.substring(i, n));
                if (number) {
                    p = sfen.charAt(i + String(number).length);
                    if (this.isGote(p)) break;
                    if (p && number < kyokumenJs.maxDuplicate) {
                        for (var j = 1; j < number; j++) {
                            label.appendChild(tspan(p, iPiece));
                        }
                    } else if (p) {
                        label.appendChild(document.createTextNode(numKanji[number - 1]));
                        iPiece += number - 1;
                    }
                    i += String(number).length;
                } else if (this.isGote(p)) {
                    break;
                }
                label.appendChild(tspan(p, iPiece));
                i++;
                iPiece++;
            }

            this.svg.appendChild(label);

            return i;
        }
    }, {
        key: 'komark',
        value: function komark(mark) {
            var e = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            e.setAttribute('class', 'komark');
            e.appendChild(document.createTextNode(mark));
            return e;
        }

        /**
         * Draw <svg gote='☖後手'> attribute with Gote's pieces in hand.
         */

    }, {
        key: 'drawGote',
        value: function drawGote(sfen, name, i) {
            var n = sfen.length;
            var label = this.goteLabel(name);
            var iPiece = 0;
            var tspan = function tspan(p, i) {
                var pt = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                pt.appendChild(document.createTextNode(Piece[p.toLowerCase()]));
                pt.setAttribute('class', 'gote-piece-hand');
                pt.setAttribute('data-i', i);
                pt.setAttribute('data-p', p.toLowerCase());
                return pt;
            };
            while (i < n) {
                var p = sfen.charAt(i);

                if (!p || p === '-' || p === ' ') {
                    i++;
                    break;
                }

                var number = parseInt(sfen.substring(i, n));
                if (number) {
                    p = sfen.charAt(i + String(number).length);
                    if (p && number < kyokumenJs.maxDuplicate) {
                        for (var j = 1; j < number; j++) {
                            label.appendChild(tspan(p, iPiece));
                            iPiece++;
                        }
                    } else if (p) {
                        label.appendChild(document.createTextNode(numKanji[number - 1]));
                        iPiece += number - 1;
                    }
                    i += String(number).length;
                } else {
                    label.appendChild(tspan(p, iPiece));
                    i++;
                    iPiece++;
                }
            }

            this.svg.appendChild(label);

            return i;
        }

        /**
         * Parse sfen string and draw pieces
         * focus: array of two integers constructed from data-made
         */

    }, {
        key: 'drawPieces',
        value: function drawPieces(sfen, sente, gote, focus) {
            // e.g. sfen='lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b'>
            // for example for initial

            var width = this.width;

            var w = width / nrow;
            var n = sfen.length;

            // Pices on board
            var i;
            var ix = 0;
            var iy = 0;

            for (i = 0; i < n; i++) {
                var p = sfen.charAt(i);
                if (p == '+') {
                    p = sfen.substring(i, i + 2);
                    i++;
                }

                var number = Number(p);
                if (p == '/') {
                    // Next row
                    ix = 0;
                    iy++;
                } else if (number) {
                    // n black squares
                    ix += number;
                } else if (p == ' ') {
                    // End of board discription
                    break;
                } else {
                    var emp = focus && focus[0] == 9 - ix && focus[1] == 1 + iy;
                    this.drawPiece(w, ix, iy, p, emp);
                    ix++;
                }
            }

            i = this.skipTeban(sfen, i);

            i = this.drawSente(sfen, sente, i);
            i = this.drawGote(sfen, gote, i);
        }

        /**
         * Draw one piece
         * Args:
         *       w:   width / nrow
         *       ix:  0...9, column index
         *       iy:  0...9, row index
         *       p:   sfen character 'p', 'P', ..., or promoted '+p', '+P', ..
         *       emp: emphasise this piece or not (bool)
         */

    }, {
        key: 'drawPiece',
        value: function drawPiece(w, ix, iy, p, emp) {
            var pieceText = Piece[p.toLowerCase()];

            if (pieceText) {
                var x = this.margin[3] + w * (ix + 0.5);
                var y = this.margin[0] + w * (iy + 0.5);
                var piece = document.createElementNS('http://www.w3.org/2000/svg', 'text');

                if (p.charAt(0) == '+') {
                    piece.setAttribute('class', 'nari-goma');
                } else {
                    piece.setAttribute('class', 'koma');
                }

                piece.setAttribute('x', x);
                piece.setAttribute('y', y);

                if (this.isGote(p)) {
                    // Rotate Gote's piece
                    var transformation = 'translate(' + x + ' ' + y + ')';
                    if (pieceText.length == 2) {
                        // Shrink the height of Gote's 成香、成桂、成銀
                        transformation += ' scale(1.0 0.5)';
                    }
                    transformation += 'rotate(180)';
                    transformation += 'translate(' + -x + ' ' + -y + ')';

                    piece.setAttribute('transform', transformation);
                } else if (pieceText.length == 2) {
                    // Shrink the height of Sente's 成香、成桂、成銀
                    var _transformation = 'translate(' + x + ' ' + y + ')';
                    _transformation += ' scale(1.0 0.5)';
                    _transformation += 'translate(' + -x + ' ' + -y + ')';
                    piece.setAttribute('transform', _transformation);
                }

                piece.setAttribute('text-anchor', 'middle');
                piece.setAttribute('dominant-baseline', 'central');
                var text;

                if (emp) {
                    text = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                    text.setAttribute('class', 'made');
                    text.appendChild(document.createTextNode(pieceText));
                } else text = document.createTextNode(pieceText);

                piece.appendChild(text);
                this.svg.appendChild(piece);
            } else {
                console.log('Error: unknown piece, ' + p);
            }
        }

        /**
         * Skip [space]b or w[space] in sfen string sfen[i] and later
         * Args:
         *     sfen (str): sfen string
         *     i (int): position of character to analysis
         * Returns:
         *     index i after [space]b/w[space]
         */

    }, {
        key: 'skipTeban',
        value: function skipTeban(sfen, i) {
            i = this.skipSpace(sfen, i);

            var n = sfen.length;
            if (i < n) {
                var p = sfen.charAt(i);
                if (p == 'b' || p == 'w') {
                    i++;
                } else {
                    console.log('Error: teban b or w not found');
                }
            }

            i = this.skipSpace(sfen, i);

            return i;
        }
    }, {
        key: 'skipSpace',
        value: function skipSpace(sfen, i) {
            var n = sfen.length;
            while (i < n) {
                if (sfen.charAt(i) === ' ') i++;else break;
            }
            return i;
        }
    }, {
        key: 'drawTitle',
        value: function drawTitle(title) {
            if (title) {
                var w = this.width / nrow;
                var x = this.margin[3] + this.width / 2;
                var y = (this.margin[0] - w) / 2;
                var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('class', 'title');
                label.setAttribute('x', x);
                label.setAttribute('y', y);
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('dominant-baseline', 'central');

                label.appendChild(document.createTextNode(title));
                this.svg.appendChild(label);
            }
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.draw();
        }
    }]);

    return Kyokumen;
}();

/*
 * Create a kyokumen object from fig = <figure class="kyokumen" sfen="...">
 */


function createKyokumen(fig) {
    var svg = createKyokumenSvg(fig);
    var width = getWidth(fig, svg);
    var margin = getPadding(fig, svg);
    var sfen = fig.getAttribute('data-sfen') || '';
    var sente = fig.getAttribute('data-sente');
    var gote = fig.getAttribute('data-gote');
    var title = fig.getAttribute('data-title');
    var focus = fig.getAttribute('data-made');
    // sente, gote can be falsy, default will be used.

    svg.style.width = String(width + margin[1] + margin[3]) + 'px';
    svg.style.height = String(width + margin[0] + margin[2]) + 'px';
    svg.style.padding = '0';

    var kyokumen = new Kyokumen(svg, width, margin, sfen, sente, gote, title, focus);

    drawBan(svg, width, margin); // Box and lines
    drawNumbersCol(svg, width, margin); // Axis label ９、８、･･･、１
    drawNumbersRow(svg, width, margin); // Axis label 一、二、･･･、九

    kyokumen.draw();
    fig.kyokumen = kyokumen;

    return kyokumen;
}

/**
 * Create a new SVG node in a given fig
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
 *Variables:
 * *fig* is an <figure> element with class='kyokumen' and an sfen attribute
 * e.g.: <figure id='fig1' class='kyokumen'
 *         sfen='lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b 1'>
 *       </figure>
 * *width*is the width of the board in pixcels
 */

function getWidth(fig, svg) {
    var owidth = fig.getAttribute('data-width');
    if (owidth) {
        return Number(owidth);
    }

    var strWidth = document.defaultView.getComputedStyle(svg, null).width;
    var width = parseFloat(strWidth);

    if (!width) {
        console.log('Error in width: ' + strWidth);
        return undefined;
    }

    return width;
}

/**
 * Return an array of
 * [padding-top, padding-right, padding-bottom, padding-top]
 */
function getPadding(fig, svg) {
    var omargin = fig.getAttribute('data-padding');

    if (omargin) {
        return omargin.split(',').map(Number);
    }

    svg = svg || getKyokumenSvg(fig);

    var margin = [0, 0, 0, 0];

    var style = document.defaultView.getComputedStyle(svg, null);

    margin[0] = parseFloat(style.paddingTop);
    margin[1] = parseFloat(style.paddingRight);
    margin[2] = parseFloat(style.paddingBottom);
    margin[3] = parseFloat(style.paddingLeft);

    return margin;
}

/**
 * Draw a square and lines for shogi-ban
 */
function drawBan(svg, width, margin) {
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'ban');
    rect.setAttribute('x', margin[3]);
    rect.setAttribute('y', margin[0]);
    rect.setAttribute('width', width);
    rect.setAttribute('height', width);
    svg.appendChild(rect);

    var w = width / nrow;

    // 横線
    for (var i = 1; i < nrow; i++) {
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'sen');
        line.setAttribute('x1', margin[3]);
        line.setAttribute('x2', margin[3] + width);
        line.setAttribute('y1', margin[0] + w * i);
        line.setAttribute('y2', margin[0] + w * i);
        svg.appendChild(line);
    }

    // 縦線
    for (var i = 1; i < nrow; i++) {
        var _line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        _line.setAttribute('x1', margin[3] + w * i);
        _line.setAttribute('x2', margin[3] + w * i);
        _line.setAttribute('class', 'sen');
        _line.setAttribute('y1', margin[0]);
        _line.setAttribute('y2', margin[0] + width);
        svg.appendChild(_line);
    }
}

/**
 *  Draw 9 ... 1 on top magin
 */
function drawNumbersCol(svg, width, margin) {
    var offsetNumCol = kyokumenJs.offsetNumCol || 0.26;

    var w = width / nrow;
    var label = ['９', '８', '７', '６', '５', '４', '３', '２', '１'];

    for (var i = 0; i < nrow; i++) {
        var num = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        num.setAttribute('class', 'num');
        num.setAttribute('x', margin[3] + w * (i + 0.5));
        num.setAttribute('y', margin[0] - w * offsetNumCol);

        num.setAttribute('text-anchor', 'middle');
        //num.setAttribute('dominant-baseline', 'middle');
        var text = document.createTextNode(label[i]);
        num.appendChild(text);
        svg.appendChild(num);
    }
}

/**
 *  Draw 一、二、･･･、九 on left margin
 */
function drawNumbersRow(svg, width, margin) {
    var offsetNumRow = kyokumenJs.offsetNumRow || 0.55;
    var w = width / nrow;

    for (var i = 0; i < nrow; i++) {
        var num = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        num.setAttribute('class', 'num');
        num.setAttribute('x', margin[3] + width + w * offsetNumRow);
        num.setAttribute('y', margin[0] + w * (i + 0.5));

        num.setAttribute('text-anchor', 'middle');
        num.setAttribute('dominant-baseline', 'central');
        var text = document.createTextNode(numKanji[i]);
        num.appendChild(text);
        svg.appendChild(num);
    }
}
function loadDefaultCSS(filename) {
  var link = document.createElement('link');
  link.href = filename;
  link.type = 'text/css';
  link.rel = 'stylesheet';

  var head = document.getElementsByTagName('head')[0];

  var firstlink = head.getElementsByTagName('link')[0];
  if (firstlink) {
    head.insertBefore(link, firstlink);
  } else {
    head.appendChild(link);
  }
}

/*
 * Main function for default use
 */
function main() {
  window.addEventListener('load', eventWindowLoaded, false);

  var defaultCSS = 'https://junkoda.github.io/kyokumen/' + kyokumenJs.ver + '/kyokumen.css';

  loadDefaultCSS(defaultCSS);

  function eventWindowLoaded() {
    setup(document.body, null);
  }

  /**
   * Traverse DOM and setup kyokumen and moves
   */
  function setup(node, fig) {
    if ((node.children || []).nodeType === 1) return fig;

    if (node.className === 'kyokumen') {
      (function () {
        fig = node;
        var kyokumen = createKyokumen(fig);
        kyokumen.svg.addEventListener('click', function () {
          return kyokumen.reset();
        }, false);
      })();
    } else if (node.className === 'mv') {
      var mv = createMv(node, fig);
      if (mv) node.addEventListener('mouseover', function () {
        return mv.draw();
      }, false);else console.log('Error: unable to create mv in tab', mv);
    } else {
      for (var i = 0; i < node.children.length; i++) {
        fig = setup(node.children[i], fig);
      }
    }

    return fig;
  }
}

main();
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Mv = function () {
    function Mv(kyokumen, sfen, sente, gote, title, focus) {
        _classCallCheck(this, Mv);

        this.kyokumen = kyokumen;
        this.sfen = sfen;
        this.sente = sente;
        this.gote = gote;
        this.title = title;
        this.focus = parseCoordinate(focus);
    }

    _createClass(Mv, [{
        key: 'draw',
        value: function draw() {
            this.kyokumen.draw(this.sfen, this.sente, this.gote, this.title, this.focus);
        }
    }]);

    return Mv;
}();

/**
 * Return <figure class="kyokumen"> object -- kyokumenFig
 * When o is a class="mv", return the kyokumenFig specified by the 'data-board'
 * When o is itself a figure opject return o.
 */


function getFig(o) {
    if (o.tagName == 'FIGURE') return o;

    var boardid = o.getAttribute('data-board');
    if (!boardid) return undefined;

    var kyokumenFig = document.getElementById(boardid);
    if (!kyokumenFig) {
        console.log('Error: board not found with id= ' + boardid);
        return undefined;
    }

    return kyokumenFig;
}

/*
 * Create a mv object from e = <span class="mv" data-sfen="..." ...>
 */
function createMv(e, fig) {
    fig = getFig(e) || fig;
    if (!fig) return undefined;

    var kyokumen = fig.kyokumen;

    var sfen = e.getAttribute('data-sfen');
    if (!sfen) {
        console.log('Error: unable to get sfen in move:');
        console.log(e);
    }

    var sente = e.getAttribute('data-sente') || fig.getAttribute('data-sente');
    var gote = e.getAttribute('data-gote') || fig.getAttribute('data-gote');
    var title = e.getAttribute('data-title') || fig.getAttribute('data-title');
    var focus = e.getAttribute('data-made');

    return new Mv(kyokumen, sfen, sente, gote, title, focus);
}
}());

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImt5b2t1bWVuLmpzIiwibWFpbi5qcyIsIm12LmpzIl0sIm5hbWVzIjpbInZlciIsInNlbnRlTWFyayIsImdvdGVNYXJrIiwibWF4RHVwbGljYXRlIiwiaGFuZE9mZnNldCIsIm9mZnNldE51bUNvbCIsIm9mZnNldE51bVJvdyIsImt5b2t1bWVuSnMiLCJkcmF3QmFuIiwiZHJhd051bWJlcnNDb2wiLCJkcmF3TnVtYmVyc1JvdyIsImt5b2t1bWVuIiwiY29uc29sZSIsImtvbWFzIiwic2ZlbiIsInNlbnRlIiwiZ290ZSIsInRpdGxlIiwiZm9jdXMiLCJsYWJlbCIsInB0IiwicCIsImlQaWVjZSIsImkiLCJlIiwiaXgiLCJpeSIsInBpZWNlIiwidHJhbnNmb3JtYXRpb24iLCJ0ZXh0Iiwic3ZnIiwiZmlnIiwicyIsIm1hcmdpbiIsInJlY3QiLCJsaW5lIiwibnVtIiwibGluayIsImhlYWQiLCJ3aW5kb3ciLCJsb2FkRGVmYXVsdENTUyIsInNldHVwIiwibWFpbiJdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFIQTtBQUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFIQTtBQUNJQTtBQUNBQztBQUNBQztBQUNBQztBQUNBQztBQUNBQztBQUNBQztBQVBlO0FBYW5CO0FBSEE7QUFDQTtBQUNBO0FBS0E7QUFIQTtBQUtBO0FBQ0E7QUFIQUM7QUFDQUE7QUFDSTtBQUtKO0FBSElDO0FBQ0FDO0FBQ0FDO0FBS0o7QUFISUM7QUFLSjtBQUhJO0FBQ0g7QUFLRDtBQUhBO0FBS0E7QUFDQTtBQUNBO0FBSEE7QUFDSTtBQUNJO0FBQ0lDO0FBQ0E7QUFDSDtBQUNEO0FBQ0E7QUFLUjtBQUhRO0FBQ0g7QUFLTDtBQUhJO0FBQ0g7QUFLRDtBQUhBO0FBS0E7QUFDQTtBQUNBO0FBQ0E7QUFISTtBQUFpRTtBQU1yRTtBQUxRO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDSDtBQU9MO0FBQ0E7QUFDQTtBQUNBO0FBUFE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNIO0FBU0w7QUFDQTtBQUNBO0FBQ0E7QUFWSTtBQVlKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVZRO0FBQ0E7QUFDSTtBQUNBQztBQUNIO0FBQ0o7QUFZTDtBQUNBO0FBQ0E7QUFYUTtBQUNJQztBQUNBQztBQUNBQztBQUNBQztBQUNBQztBQUNIO0FBYVQ7QUFYUTtBQUNBO0FBQ0E7QUFDSDtBQWFMO0FBQ0E7QUFDQTtBQUNBO0FBZEk7QUFnQko7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQWRRO0FBQ0g7QUFnQkw7QUFDQTtBQUNBO0FBZlE7QUFDQTtBQUNBO0FBQ0E7QUFDQUM7QUFDQUE7QUFDQUE7QUFDQUE7QUFDQUE7QUFDQTtBQUlBQTtBQUNBQTtBQUNBO0FBQ0g7QUFjTDtBQUNBO0FBQ0E7QUFiUTtBQUNBO0FBQ0E7QUFDQUE7QUFDQUE7QUFDQUE7QUFDQUE7QUFDQUE7QUFDQUE7QUFlUjtBQWJRO0FBSUFBO0FBQ0FBO0FBWVI7QUFWUTtBQUNIO0FBWUw7QUFWSTtBQVlKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQWJRO0FBQ0E7QUFDQTtBQUNBO0FBQ0k7QUFDQUM7QUFDQUE7QUFDQUE7QUFDQUE7QUFDQTtBQUNIO0FBQ0Q7QUFDSTtBQUNBO0FBZVo7QUFaWTtBQUNBO0FBQ0lDO0FBQ0E7QUFDQTtBQUNJO0FBQ0lGO0FBQ0g7QUFDSjtBQUVHQTtBQUNBRztBQUNIO0FBQ0RDO0FBQ0g7QUFFRztBQUNIO0FBQ0RKO0FBQ0FJO0FBQ0FEO0FBQ0g7QUFZVDtBQVZRO0FBWVI7QUFWUTtBQUNIO0FBWUw7QUFDQTtBQUNBO0FBWFE7QUFDQUU7QUFDQUE7QUFDQTtBQUNIO0FBYUw7QUFYSTtBQWFKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQWRRO0FBQ0E7QUFDQTtBQUNBO0FBQ0k7QUFDQUo7QUFDQUE7QUFDQUE7QUFDQUE7QUFDQTtBQUNIO0FBQ0Q7QUFDSTtBQWdCWjtBQWRZO0FBQ0lHO0FBQ0E7QUFDSDtBQWdCYjtBQWRZO0FBQ0E7QUFDSUY7QUFDQTtBQUNJ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QUNBO0FFcHNCQTtBQUNJO0FGc3NCSjtBRW5zQkk7QUFDQTtBRnFzQko7QUVsc0JJO0FBQ0E7QUFDSTlCO0FBQ0E7QUFDSDtBRm9zQkw7QUVsc0JJO0FBQ0g7QUZvc0JEO0FFbHNCQTtBRm9zQkE7QUFDQTtBRWxzQkE7QUFDSW1CO0FBQ0E7QUZvc0JKO0FFbHNCSTtBRm9zQko7QUVsc0JJO0FBQ0E7QUFDSW5CO0FBQ0FBO0FBQ0g7QUZvc0JMO0FFbHNCSTtBQUNBO0FBQ0E7QUFDQTtBRm9zQko7QUVsc0JJO0FBQ0giLCJmaWxlIjoia3lva3VtZW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGt5b2t1bWVuLmpzOiBBIGxpYnJhcnkgZm9yIHNob2dpIGRvY3VtZW50cyBvbiB0aGUgd2ViXG4gKiBBdXRob3I6ICAgICAgSnVuIEtvZGEgKDIwMTYpXG4gKiBXZWJzaXRlOiAgICAgaHR0cHM6Ly9naXRodWIuY29tL2p1bmtvZGEva3lva3VtZW5cbiAqL1xuXG5jb25zdCBreW9rdW1lbkpzID0ge1xuICAgIHZlcjogJzAnLFxuICAgIHNlbnRlTWFyazogJ+KYlycsXG4gICAgZ290ZU1hcms6ICfimJYnLFxuICAgIG1heER1cGxpY2F0ZTogMyxcbiAgICBoYW5kT2Zmc2V0OiAwLjEsXG4gICAgb2Zmc2V0TnVtQ29sOiAwLjI2LFxuICAgIG9mZnNldE51bVJvdzogMC41NVxufTtcblxuY29uc3QgbnJvdyA9IDk7XG5jb25zdCBQaWVjZSA9IHsgbDon6aaZJywgbjon5qGCJywgczon6YqAJywgZzon6YeRJywgazon546JJywgcjon6aObJywgYjon6KeSJywgcDon5q2pJywgJytsJzon5oiQ6aaZJywgJytuJzon5oiQ5qGCJywgJytzJzon5oiQ6YqAJywgJytyJzon6b6NJywgJytiJzon6aasJywgJytwJzon44GoJ307XG5jb25zdCBudW1LYW5qaSA9IFsn5LiAJywgJ+S6jCcsICfkuIknLCAn5ZubJywgJ+S6lCcsICflha0nLCAn5LiDJywgJ+WFqycsICfkuZ0nLCAn5Y2BJywgJ+WNgeS4gCcsICfljYHkuownLCAn5Y2B5LiJJywgJ+WNgeWbmycsICfljYHkupQnLCAn5Y2B5YWtJywgJ+WNgeS4gycsICfljYHlhasnXTtcblxuLypcbiAqIEFQSSBvZiBreW9rdW1lbi5qcyB1c2FibGUgYnkgb3RoZXIgY29kZXNcbiAqL1xua3lva3VtZW5Kcy5jcmVhdGVLeW9rdW1lbiA9IGNyZWF0ZUt5b2t1bWVuOyAvLyBjcmVhdGUgYSBreW9rdW1lbiBpbiBmaWd1cmVcbmt5b2t1bWVuSnMuS3lva3VtZW4gPSBmdW5jdGlvbihzdmcsIHdpZHRoLCBtYXJnaW4pIHtcbiAgICBsZXQga3lva3VtZW4gPSBuZXcgS3lva3VtZW4oc3ZnLCB3aWR0aCwgbWFyZ2luLCAnJyk7XG5cbiAgICBkcmF3QmFuKHN2Zywgd2lkdGgsIG1hcmdpbik7ICAgICAgICAvLyBCb3ggYW5kIGxpbmVzXG4gICAgZHJhd051bWJlcnNDb2woc3ZnLCB3aWR0aCwgbWFyZ2luKTsgLy8gQXhpcyBsYWJlbCDvvJnjgIHvvJjjgIHvvaXvvaXvvaXjgIHvvJFcbiAgICBkcmF3TnVtYmVyc1JvdyhzdmcsIHdpZHRoLCBtYXJnaW4pOyAvLyBBeGlzIGxhYmVsIOS4gOOAgeS6jOOAge+9pe+9pe+9peOAgeS5nVxuXG4gICAga3lva3VtZW4uZHJhdygpO1xuXG4gICAgcmV0dXJuIGt5b2t1bWVuO1xufTtcblxuLyoqXG4gKiBzIChzdHIpOiBzdHJpbmcgb2YgdHdvIG51bWJlcnMgJzEyJ1xuICogUmV0dXJuczogYXJyYXkgWzEsIDJdXG4gKi9cbmZ1bmN0aW9uIHBhcnNlQ29vcmRpbmF0ZShzKSB7XG4gICAgaWYgKHR5cGVvZiBzID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAocy5sZW5ndGggIT0gMikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yOiBkYXRhLW1hZGUgbXVzdCBoYXZlIHR3byBpbnRlZ2VycycsIHMpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaXggPSBwYXJzZUludChzWzBdKTtcbiAgICAgICAgY29uc3QgaXkgPSBwYXJzZUludChzWzFdKTtcblxuICAgICAgICBpZiAoaXggJiYgaXkpIHJldHVybiBbaXgsIGl5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBreW9rdW1lbiBvYmplY3QgY29uc3RydWN0b3JcbiAqL1xuY2xhc3MgS3lva3VtZW4ge1xuXG4gICAgY29uc3RydWN0b3Ioc3ZnLCB3aWR0aCwgbWFyZ2luLCBzZmVuLCBzZW50ZSwgZ290ZSwgdGl0bGUsIGZvY3VzKSB7XG4gICAgICAgIHRoaXMuc3ZnID0gc3ZnO1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMubWFyZ2luID0gbWFyZ2luO1xuICAgICAgICB0aGlzLnNmZW4gPSBzZmVuO1xuICAgICAgICB0aGlzLnNlbnRlID0gc2VudGU7XG4gICAgICAgIHRoaXMuZ290ZSA9IGdvdGU7XG4gICAgICAgIHRoaXMudGl0bGUgPSB0aXRsZTtcbiAgICAgICAgdGhpcy5mb2N1cyA9IHBhcnNlQ29vcmRpbmF0ZShmb2N1cyk7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY2xlYXJLeW9rdW1lbigna29tYScpO1xuICAgICAgICB0aGlzLmNsZWFyS3lva3VtZW4oJ25hcmktZ29tYScpO1xuICAgICAgICB0aGlzLmNsZWFyS3lva3VtZW4oJ3NlbnRlJyk7XG4gICAgICAgIHRoaXMuY2xlYXJLeW9rdW1lbignZ290ZScpO1xuICAgICAgICB0aGlzLmNsZWFyS3lva3VtZW4oJ3RpdGxlJyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjbGFzcz1jbHMgY2hpbGQgZWxlbWVudHMgZnJvbSBreW9rdW1lblxuICAgICAqIEFyZ3M6XG4gICAgICogICAgIGt5b2t1bWVuOiBhIERPTSBlbGVtZW50XG4gICAgICogICAgIGNscyAoc3RyaW5nKTogY2xhc3MgbmFtZSAna29tYScsICduYXJpLWdvbWEnLCAuLi5cbiAgICAgKi9cbiAgICBjbGVhckt5b2t1bWVuKGNscykge1xuICAgICAgICBsZXQga29tYXMgPSB0aGlzLnN2Zy5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGNscyk7XG4gICAgICAgIHdoaWxlIChrb21hcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnN2Zy5yZW1vdmVDaGlsZChrb21hc1swXSk7XG4gICAgICAgICAgICBrb21hcyA9IHRoaXMuc3ZnLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoY2xzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXcoc2Zlbiwgc2VudGUsIGdvdGUsIHRpdGxlLCBmb2N1cykge1xuICAgICAgICBpZiAoc2ZlbiA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNmZW4gPSBzZmVuIHx8IHRoaXMuc2ZlbjtcbiAgICAgICAgICAgIHNlbnRlID0gc2VudGUgfHwgdGhpcy5zZW50ZTtcbiAgICAgICAgICAgIGdvdGUgPSBnb3RlIHx8IHRoaXMuZ290ZTtcbiAgICAgICAgICAgIHRpdGxlID0gdGl0bGUgfHwgdGhpcy50aXRsZTtcbiAgICAgICAgICAgIGZvY3VzID0gZm9jdXMgfHwgdGhpcy5mb2N1cztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5kcmF3VGl0bGUodGl0bGUpO1xuICAgICAgICB0aGlzLmRyYXdQaWVjZXMoc2Zlbiwgc2VudGUsIGdvdGUsIGZvY3VzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBjaGFyYWN0ZXIgaXMgbG93ZXIgY2FzZS5cbiAgICAgKiBUcnVlIGZvciAncCcsICcrcCcsICdsJywgLi4uXG4gICAgICogRmFsc2UgZm9yICdQJywgJytQJywgJ0wnLCAuLi5cbiAgICAgKi9cbiAgICBpc0dvdGUoYykge1xuICAgICAgICByZXR1cm4gYyA9PSBjLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgc2VudGVMYWJlbChuYW1lKSB7XG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLndpZHRoIC8gbnJvdztcbiAgICAgICAgY29uc3QgeCA9IHRoaXMubWFyZ2luWzNdICsgdGhpcy53aWR0aCArIHcgKyAodGhpcy5tYXJnaW5bMV0gLSB3KSAvIDI7XG4gICAgICAgIGNvbnN0IHkgPSB0aGlzLm1hcmdpblswXSArIHRoaXMud2lkdGggLSBreW9rdW1lbkpzLmhhbmRPZmZzZXQgKiB3O1xuICAgICAgICBsZXQgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ3RleHQnKTtcbiAgICAgICAgbGFiZWwuc2V0QXR0cmlidXRlKCdjbGFzcycsICdzZW50ZScpO1xuICAgICAgICBsYWJlbC5zZXRBdHRyaWJ1dGUoJ3gnLCB4KTtcbiAgICAgICAgbGFiZWwuc2V0QXR0cmlidXRlKCd5JywgeSk7XG4gICAgICAgIGxhYmVsLnNldEF0dHJpYnV0ZSgndGV4dC1hbmNob3InLCAnZW5kJyk7XG4gICAgICAgIGxhYmVsLnNldEF0dHJpYnV0ZSgnZG9taW5hbnQtYmFzZWxpbmUnLCAnY2VudHJhbCcpO1xuICAgICAgICBpZiAoIW5hbWUpXG4gICAgICAgICAgICBuYW1lID0gJyDlhYjmiYsgJztcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbmFtZSA9ICcgJyArIG5hbWUgKyAnICc7XG4gICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKHRoaXMua29tYXJrKGt5b2t1bWVuSnMuc2VudGVNYXJrKSk7XG4gICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG5hbWUpKTtcbiAgICAgICAgcmV0dXJuIGxhYmVsO1xuICAgIH1cblxuICAgIGdvdGVMYWJlbChuYW1lKSB7XG4gICAgICAgIGNvbnN0IHggPSB0aGlzLm1hcmdpblszXSAvIDI7XG4gICAgICAgIGNvbnN0IHkgPSB0aGlzLm1hcmdpblswXTtcbiAgICAgICAgbGV0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsICd0ZXh0Jyk7XG4gICAgICAgIGxhYmVsLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZ290ZScpO1xuICAgICAgICBsYWJlbC5zZXRBdHRyaWJ1dGUoJ3gnLCB4KTtcbiAgICAgICAgbGFiZWwuc2V0QXR0cmlidXRlKCd5JywgeSk7XG4gICAgICAgIGxhYmVsLnNldEF0dHJpYnV0ZSgndGV4dC1hbmNob3InLCAnZW5kJyk7XG4gICAgICAgIGxhYmVsLnNldEF0dHJpYnV0ZSgnZG9taW5hbnQtYmFzZWxpbmUnLCAnY2VudHJhbCcpO1xuICAgICAgICBsYWJlbC5zZXRBdHRyaWJ1dGUoJ3RyYW5zZm9ybScsIGByb3RhdGUoMTgwICR7eH0gJHt5fSlgKTtcblxuICAgICAgICBpZiAoIW5hbWUpXG4gICAgICAgICAgICBuYW1lID0gJyDlvozmiYsgJztcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbmFtZSA9ICcgJyArIG5hbWUgKyAnICc7XG4gICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKHRoaXMua29tYXJrKGt5b2t1bWVuSnMuZ290ZU1hcmspKTtcbiAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobmFtZSkpO1xuXG4gICAgICAgIHJldHVybiBsYWJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEcmF3IDxzdmcgc2VudGU9J+KYl+WFiOaJiyc+IGF0cnJpYnV0ZSB3aXRoIFNlbnRlJ3MgcGllY2VzIGluIGhhbmQuXG4gICAgICovXG4gICAgZHJhd1NlbnRlKHNmZW4sIG5hbWUsIGkpIHtcbiAgICAgICAgdmFyIG4gPSBzZmVuLmxlbmd0aDtcbiAgICAgICAgbGV0IGxhYmVsID0gdGhpcy5zZW50ZUxhYmVsKG5hbWUpO1xuICAgICAgICBsZXQgaVBpZWNlID0gMDtcbiAgICAgICAgbGV0IHRzcGFuID0gZnVuY3Rpb24ocCwgaSkge1xuICAgICAgICAgICAgbGV0IHB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsICd0c3BhbicpO1xuICAgICAgICAgICAgcHQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoUGllY2VbcC50b0xvd2VyQ2FzZSgpXSkpO1xuICAgICAgICAgICAgcHQuc2V0QXR0cmlidXRlKCdjbGFzcycsICdzZW50ZS1waWVjZS1oYW5kJyk7XG4gICAgICAgICAgICBwdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtaScsIGkpO1xuICAgICAgICAgICAgcHQuc2V0QXR0cmlidXRlKCdkYXRhLXAnLCBwLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHB0O1xuICAgICAgICB9O1xuICAgICAgICB3aGlsZSAoaSA8IG4pIHtcbiAgICAgICAgICAgIHZhciBwID0gc2Zlbi5jaGFyQXQoaSk7XG4gICAgICAgICAgICBpZiAocCA9PT0gJy0nIHx8IHAgPT09ICcgJylcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY29uc3QgbnVtYmVyID0gcGFyc2VJbnQoc2Zlbi5zdWJzdHJpbmcoaSwgbikpO1xuICAgICAgICAgICAgaWYgKG51bWJlcikge1xuICAgICAgICAgICAgICAgIHAgPSBzZmVuLmNoYXJBdChpICsgU3RyaW5nKG51bWJlcikubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0dvdGUocCkpIGJyZWFrO1xuICAgICAgICAgICAgICAgIGlmIChwICYmIG51bWJlciA8IGt5b2t1bWVuSnMubWF4RHVwbGljYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxOyBqIDwgbnVtYmVyOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKHRzcGFuKHAsIGlQaWVjZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHApIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobnVtS2FuamlbbnVtYmVyIC0gMV0pKTtcbiAgICAgICAgICAgICAgICAgICAgaVBpZWNlICs9IG51bWJlciAtIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGkgKz0gU3RyaW5nKG51bWJlcikubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5pc0dvdGUocCkpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKHRzcGFuKHAsIGlQaWVjZSkpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgaVBpZWNlKys7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN2Zy5hcHBlbmRDaGlsZChsYWJlbCk7XG5cbiAgICAgICAgcmV0dXJuIGk7XG4gICAgfVxuXG4gICAga29tYXJrKG1hcmspIHtcbiAgICAgICAgbGV0IGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ3RzcGFuJyk7XG4gICAgICAgIGUuc2V0QXR0cmlidXRlKCdjbGFzcycsICdrb21hcmsnKTtcbiAgICAgICAgZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShtYXJrKSk7XG4gICAgICAgIHJldHVybiBlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERyYXcgPHN2ZyBnb3RlPSfimJblvozmiYsnPiBhdHRyaWJ1dGUgd2l0aCBHb3RlJ3MgcGllY2VzIGluIGhhbmQuXG4gICAgICovXG4gICAgZHJhd0dvdGUoc2ZlbiwgbmFtZSwgaSkge1xuICAgICAgICBsZXQgbiA9IHNmZW4ubGVuZ3RoO1xuICAgICAgICBsZXQgbGFiZWwgPSB0aGlzLmdvdGVMYWJlbChuYW1lKTtcbiAgICAgICAgbGV0IGlQaWVjZSA9IDA7XG4gICAgICAgIGxldCB0c3BhbiA9IGZ1bmN0aW9uKHAsIGkpIHtcbiAgICAgICAgICAgIGxldCBwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAndHNwYW4nKTtcbiAgICAgICAgICAgIHB0LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFBpZWNlW3AudG9Mb3dlckNhc2UoKV0pKTtcbiAgICAgICAgICAgIHB0LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZ290ZS1waWVjZS1oYW5kJyk7XG4gICAgICAgICAgICBwdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtaScsIGkpO1xuICAgICAgICAgICAgcHQuc2V0QXR0cmlidXRlKCdkYXRhLXAnLCBwLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHB0O1xuICAgICAgICB9O1xuICAgICAgICB3aGlsZSAoaSA8IG4pIHtcbiAgICAgICAgICAgIGxldCBwID0gc2Zlbi5jaGFyQXQoaSk7XG5cbiAgICAgICAgICAgIGlmICghcCB8fCBwID09PSAnLScgfHwgcCA9PT0gJyAnKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBudW1iZXIgPSBwYXJzZUludChzZmVuLnN1YnN0cmluZyhpLCBuKSk7XG4gICAgICAgICAgICBpZiAobnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgcCA9IHNmZW4uY2hhckF0KGkgKyBTdHJpbmcobnVtYmVyKS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGlmIChwICYmIG51bWJlciA8IGt5b2t1bWVuSnMubWF4RHVwbGljYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxOyBqIDwgbnVtYmVyOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKHRzcGFuKHAsIGlQaWVjZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaVBpZWNlKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHApIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobnVtS2FuamlbbnVtYmVyIC0gMV0pKTtcbiAgICAgICAgICAgICAgICAgICAgaVBpZWNlICs9IG51bWJlciAtIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGkgKz0gU3RyaW5nKG51bWJlcikubGVuZ3RoO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZCh0c3BhbihwLCBpUGllY2UpKTtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgaVBpZWNlKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN2Zy5hcHBlbmRDaGlsZChsYWJlbCk7XG5cbiAgICAgICAgcmV0dXJuIGk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGFyc2Ugc2ZlbiBzdHJpbmcgYW5kIGRyYXcgcGllY2VzXG4gICAgICogZm9jdXM6IGFycmF5IG9mIHR3byBpbnRlZ2VycyBjb25zdHJ1Y3RlZCBmcm9tIGRhdGEtbWFkZVxuICAgICAqL1xuICAgIGRyYXdQaWVjZXMoc2Zlbiwgc2VudGUsIGdvdGUsIGZvY3VzKSB7XG4gICAgICAgIC8vIGUuZy4gc2Zlbj0nbG5zZ2tnc25sLzFyNWIxL3BwcHBwcHBwcC85LzkvOS9QUFBQUFBQUFAvMUI1UjEvTE5TR0tHU05MIGInPlxuICAgICAgICAvLyBmb3IgZXhhbXBsZSBmb3IgaW5pdGlhbFxuXG4gICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy53aWR0aDtcblxuICAgICAgICBjb25zdCB3ID0gd2lkdGggLyBucm93O1xuICAgICAgICBjb25zdCBuID0gc2Zlbi5sZW5ndGg7XG5cbiAgICAgICAgLy8gUGljZXMgb24gYm9hcmRcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBpeCA9IDA7XG4gICAgICAgIHZhciBpeSA9IDA7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgbGV0IHAgPSBzZmVuLmNoYXJBdChpKTtcbiAgICAgICAgICAgIGlmIChwID09ICcrJykge1xuICAgICAgICAgICAgICAgIHAgPSBzZmVuLnN1YnN0cmluZyhpLCBpICsgMik7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBudW1iZXIgPSBOdW1iZXIocCk7XG4gICAgICAgICAgICBpZiAocCA9PSAnLycpIHsgLy8gTmV4dCByb3dcbiAgICAgICAgICAgICAgICBpeCA9IDA7XG4gICAgICAgICAgICAgICAgaXkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG51bWJlcikgeyAvLyBuIGJsYWNrIHNxdWFyZXNcbiAgICAgICAgICAgICAgICBpeCArPSBudW1iZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChwID09ICcgJykgeyAvLyBFbmQgb2YgYm9hcmQgZGlzY3JpcHRpb25cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVtcCA9IGZvY3VzICYmIGZvY3VzWzBdID09IDkgLSBpeCAmJiBmb2N1c1sxXSA9PSAxICsgaXk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3UGllY2UodywgaXgsIGl5LCBwLCBlbXApO1xuICAgICAgICAgICAgICAgIGl4Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpID0gdGhpcy5za2lwVGViYW4oc2ZlbiwgaSk7XG5cbiAgICAgICAgaSA9IHRoaXMuZHJhd1NlbnRlKHNmZW4sIHNlbnRlLCBpKTtcbiAgICAgICAgaSA9IHRoaXMuZHJhd0dvdGUoc2ZlbiwgZ290ZSwgaSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRHJhdyBvbmUgcGllY2VcbiAgICAgKiBBcmdzOlxuICAgICAqICAgICAgIHc6ICAgd2lkdGggLyBucm93XG4gICAgICogICAgICAgaXg6ICAwLi4uOSwgY29sdW1uIGluZGV4XG4gICAgICogICAgICAgaXk6ICAwLi4uOSwgcm93IGluZGV4XG4gICAgICogICAgICAgcDogICBzZmVuIGNoYXJhY3RlciAncCcsICdQJywgLi4uLCBvciBwcm9tb3RlZCAnK3AnLCAnK1AnLCAuLlxuICAgICAqICAgICAgIGVtcDogZW1waGFzaXNlIHRoaXMgcGllY2Ugb3Igbm90IChib29sKVxuICAgICAqL1xuICAgIGRyYXdQaWVjZSh3LCBpeCwgaXksIHAsIGVtcCkge1xuICAgICAgICB2YXIgcGllY2VUZXh0ID0gUGllY2VbcC50b0xvd2VyQ2FzZSgpXTtcblxuICAgICAgICBpZiAocGllY2VUZXh0KSB7XG4gICAgICAgICAgICB2YXIgeCA9IHRoaXMubWFyZ2luWzNdICsgdyAqIChpeCArIDAuNSk7XG4gICAgICAgICAgICB2YXIgeSA9IHRoaXMubWFyZ2luWzBdICsgdyAqIChpeSArIDAuNSk7XG4gICAgICAgICAgICB2YXIgcGllY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ3RleHQnKTtcblxuICAgICAgICAgICAgaWYgKHAuY2hhckF0KDApID09ICcrJykge1xuICAgICAgICAgICAgICAgIHBpZWNlLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnbmFyaS1nb21hJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBpZWNlLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAna29tYScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwaWVjZS5zZXRBdHRyaWJ1dGUoJ3gnLCB4KTtcbiAgICAgICAgICAgIHBpZWNlLnNldEF0dHJpYnV0ZSgneScsIHkpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0dvdGUocCkpIHtcbiAgICAgICAgICAgICAgICAvLyBSb3RhdGUgR290ZSdzIHBpZWNlXG4gICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybWF0aW9uID0gYHRyYW5zbGF0ZSgke3h9ICR7eX0pYDtcbiAgICAgICAgICAgICAgICBpZiAocGllY2VUZXh0Lmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNocmluayB0aGUgaGVpZ2h0IG9mIEdvdGUncyDmiJDpppnjgIHmiJDmoYLjgIHmiJDpioBcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb24gKz0gJyBzY2FsZSgxLjAgMC41KSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uICs9ICdyb3RhdGUoMTgwKSc7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb24gKz0gYHRyYW5zbGF0ZSgkey14fSAkey15fSlgO1xuXG4gICAgICAgICAgICAgICAgcGllY2Uuc2V0QXR0cmlidXRlKCd0cmFuc2Zvcm0nLCB0cmFuc2Zvcm1hdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChwaWVjZVRleHQubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgICAgICAvLyBTaHJpbmsgdGhlIGhlaWdodCBvZiBTZW50ZSdzIOaIkOmmmeOAgeaIkOahguOAgeaIkOmKgFxuICAgICAgICAgICAgICAgIGxldCB0cmFuc2Zvcm1hdGlvbiA9IGB0cmFuc2xhdGUoJHt4fSAke3l9KWA7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb24gKz0gJyBzY2FsZSgxLjAgMC41KSc7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb24gKz0gYHRyYW5zbGF0ZSgkey14fSAkey15fSlgO1xuICAgICAgICAgICAgICAgIHBpZWNlLnNldEF0dHJpYnV0ZSgndHJhbnNmb3JtJywgdHJhbnNmb3JtYXRpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwaWVjZS5zZXRBdHRyaWJ1dGUoJ3RleHQtYW5jaG9yJywgJ21pZGRsZScpO1xuICAgICAgICAgICAgcGllY2Uuc2V0QXR0cmlidXRlKCdkb21pbmFudC1iYXNlbGluZScsICdjZW50cmFsJyk7XG4gICAgICAgICAgICB2YXIgdGV4dDtcblxuICAgICAgICAgICAgaWYgKGVtcCkge1xuICAgICAgICAgICAgICAgIHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ3RzcGFuJyk7XG4gICAgICAgICAgICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ21hZGUnKTtcbiAgICAgICAgICAgICAgICB0ZXh0LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBpZWNlVGV4dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwaWVjZVRleHQpO1xuXG4gICAgICAgICAgICBwaWVjZS5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICAgICAgICAgIHRoaXMuc3ZnLmFwcGVuZENoaWxkKHBpZWNlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvcjogdW5rbm93biBwaWVjZSwgJyArIHApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2tpcCBbc3BhY2VdYiBvciB3W3NwYWNlXSBpbiBzZmVuIHN0cmluZyBzZmVuW2ldIGFuZCBsYXRlclxuICAgICAqIEFyZ3M6XG4gICAgICogICAgIHNmZW4gKHN0cik6IHNmZW4gc3RyaW5nXG4gICAgICogICAgIGkgKGludCk6IHBvc2l0aW9uIG9mIGNoYXJhY3RlciB0byBhbmFseXNpc1xuICAgICAqIFJldHVybnM6XG4gICAgICogICAgIGluZGV4IGkgYWZ0ZXIgW3NwYWNlXWIvd1tzcGFjZV1cbiAgICAgKi9cbiAgICBza2lwVGViYW4oc2ZlbiwgaSkge1xuICAgICAgICBpID0gdGhpcy5za2lwU3BhY2Uoc2ZlbiwgaSk7XG5cbiAgICAgICAgdmFyIG4gPSBzZmVuLmxlbmd0aDtcbiAgICAgICAgaWYgKGkgPCBuKSB7XG4gICAgICAgICAgICBsZXQgcCA9IHNmZW4uY2hhckF0KGkpO1xuICAgICAgICAgICAgaWYgKHAgPT0gJ2InIHx8IHAgPT0gJ3cnKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3I6IHRlYmFuIGIgb3IgdyBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGkgPSB0aGlzLnNraXBTcGFjZShzZmVuLCBpKTtcblxuICAgICAgICByZXR1cm4gaTtcbiAgICB9XG5cblxuICAgIHNraXBTcGFjZShzZmVuLCBpKSB7XG4gICAgICAgIGxldCBuID0gc2Zlbi5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpIDwgbikge1xuICAgICAgICAgICAgaWYgKHNmZW4uY2hhckF0KGkpID09PSAnICcpXG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpO1xuICAgIH1cblxuICAgIGRyYXdUaXRsZSh0aXRsZSkge1xuICAgICAgICBpZiAodGl0bGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHcgPSB0aGlzLndpZHRoIC8gbnJvdztcbiAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLm1hcmdpblszXSArIHRoaXMud2lkdGggLyAyO1xuICAgICAgICAgICAgY29uc3QgeSA9ICh0aGlzLm1hcmdpblswXSAtIHcpIC8gMjtcbiAgICAgICAgICAgIGxldCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAndGV4dCcpO1xuICAgICAgICAgICAgbGFiZWwuc2V0QXR0cmlidXRlKCdjbGFzcycsICd0aXRsZScpO1xuICAgICAgICAgICAgbGFiZWwuc2V0QXR0cmlidXRlKCd4JywgeCk7XG4gICAgICAgICAgICBsYWJlbC5zZXRBdHRyaWJ1dGUoJ3knLCB5KTtcbiAgICAgICAgICAgIGxhYmVsLnNldEF0dHJpYnV0ZSgndGV4dC1hbmNob3InLCAnbWlkZGxlJyk7XG4gICAgICAgICAgICBsYWJlbC5zZXRBdHRyaWJ1dGUoJ2RvbWluYW50LWJhc2VsaW5lJywgJ2NlbnRyYWwnKTtcblxuICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGl0bGUpKTtcbiAgICAgICAgICAgIHRoaXMuc3ZnLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmRyYXcoKTtcbiAgICB9XG59XG5cbi8qXG4gKiBDcmVhdGUgYSBreW9rdW1lbiBvYmplY3QgZnJvbSBmaWcgPSA8ZmlndXJlIGNsYXNzPVwia3lva3VtZW5cIiBzZmVuPVwiLi4uXCI+XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUt5b2t1bWVuKGZpZykge1xuICAgIHZhciBzdmcgPSBjcmVhdGVLeW9rdW1lblN2ZyhmaWcpO1xuICAgIGNvbnN0IHdpZHRoID0gZ2V0V2lkdGgoZmlnLCBzdmcpO1xuICAgIGNvbnN0IG1hcmdpbiA9IGdldFBhZGRpbmcoZmlnLCBzdmcpO1xuICAgIGNvbnN0IHNmZW4gPSBmaWcuZ2V0QXR0cmlidXRlKCdkYXRhLXNmZW4nKSB8fCAnJztcbiAgICBjb25zdCBzZW50ZSA9IGZpZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc2VudGUnKTtcbiAgICBjb25zdCBnb3RlID0gZmlnLmdldEF0dHJpYnV0ZSgnZGF0YS1nb3RlJyk7XG4gICAgY29uc3QgdGl0bGUgPSBmaWcuZ2V0QXR0cmlidXRlKCdkYXRhLXRpdGxlJyk7XG4gICAgY29uc3QgZm9jdXMgPSBmaWcuZ2V0QXR0cmlidXRlKCdkYXRhLW1hZGUnKTtcbiAgICAvLyBzZW50ZSwgZ290ZSBjYW4gYmUgZmFsc3ksIGRlZmF1bHQgd2lsbCBiZSB1c2VkLlxuXG4gICAgc3ZnLnN0eWxlLndpZHRoID0gU3RyaW5nKHdpZHRoICsgbWFyZ2luWzFdICsgbWFyZ2luWzNdKSArICdweCc7XG4gICAgc3ZnLnN0eWxlLmhlaWdodCA9IFN0cmluZyh3aWR0aCArIG1hcmdpblswXSArIG1hcmdpblsyXSkgKyAncHgnO1xuICAgIHN2Zy5zdHlsZS5wYWRkaW5nID0gJzAnO1xuXG4gICAgbGV0IGt5b2t1bWVuID0gbmV3IEt5b2t1bWVuKHN2Zywgd2lkdGgsIG1hcmdpbiwgc2Zlbiwgc2VudGUsIGdvdGUsIHRpdGxlLCBmb2N1cyk7XG5cbiAgICBkcmF3QmFuKHN2Zywgd2lkdGgsIG1hcmdpbik7ICAgICAgICAvLyBCb3ggYW5kIGxpbmVzXG4gICAgZHJhd051bWJlcnNDb2woc3ZnLCB3aWR0aCwgbWFyZ2luKTsgLy8gQXhpcyBsYWJlbCDvvJnjgIHvvJjjgIHvvaXvvaXvvaXjgIHvvJFcbiAgICBkcmF3TnVtYmVyc1JvdyhzdmcsIHdpZHRoLCBtYXJnaW4pOyAvLyBBeGlzIGxhYmVsIOS4gOOAgeS6jOOAge+9pe+9pe+9peOAgeS5nVxuXG4gICAga3lva3VtZW4uZHJhdygpO1xuICAgIGZpZy5reW9rdW1lbiA9IGt5b2t1bWVuO1xuXG4gICAgcmV0dXJuIGt5b2t1bWVuO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBTVkcgbm9kZSBpbiBhIGdpdmVuIGZpZ1xuICovXG5mdW5jdGlvbiBjcmVhdGVLeW9rdW1lblN2ZyhmaWcpIHtcbiAgICB2YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAnc3ZnJyk7XG4gICAgcy5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2t5b2t1bWVuLXN2ZycpO1xuXG4gICAgdmFyIGZpZ0lkID0gZmlnLmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICBpZiAoZmlnSWQpIHtcbiAgICAgICAgcy5zZXRBdHRyaWJ1dGUoJ2lkJywgZmlnSWQgKyAnLXN2ZycpO1xuICAgIH1cblxuICAgIGZpZy5hcHBlbmRDaGlsZChzKTtcblxuICAgIHJldHVybiBzO1xufVxuXG5cbi8qKlxuICpWYXJpYWJsZXM6XG4gKiAqZmlnKiBpcyBhbiA8ZmlndXJlPiBlbGVtZW50IHdpdGggY2xhc3M9J2t5b2t1bWVuJyBhbmQgYW4gc2ZlbiBhdHRyaWJ1dGVcbiAqIGUuZy46IDxmaWd1cmUgaWQ9J2ZpZzEnIGNsYXNzPSdreW9rdW1lbidcbiAqICAgICAgICAgc2Zlbj0nbG5zZ2tnc25sLzFyNWIxL3BwcHBwcHBwcC85LzkvOS9QUFBQUFBQUFAvMUI1UjEvTE5TR0tHU05MIGIgMSc+XG4gKiAgICAgICA8L2ZpZ3VyZT5cbiAqICp3aWR0aCppcyB0aGUgd2lkdGggb2YgdGhlIGJvYXJkIGluIHBpeGNlbHNcbiAqL1xuXG5mdW5jdGlvbiBnZXRXaWR0aChmaWcsIHN2Zykge1xuICAgIGNvbnN0IG93aWR0aCA9IGZpZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtd2lkdGgnKTtcbiAgICBpZiAob3dpZHRoKSB7XG4gICAgICAgIHJldHVybiBOdW1iZXIob3dpZHRoKTtcbiAgICB9XG5cbiAgICB2YXIgc3RyV2lkdGggPSBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKHN2ZywgbnVsbCkud2lkdGg7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VGbG9hdChzdHJXaWR0aCk7XG5cbiAgICBpZiAoIXdpZHRoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBpbiB3aWR0aDogJyArIHN0cldpZHRoKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gd2lkdGg7XG59XG5cblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgb2ZcbiAqIFtwYWRkaW5nLXRvcCwgcGFkZGluZy1yaWdodCwgcGFkZGluZy1ib3R0b20sIHBhZGRpbmctdG9wXVxuICovXG5mdW5jdGlvbiBnZXRQYWRkaW5nKGZpZywgc3ZnKSB7XG4gICAgY29uc3Qgb21hcmdpbiA9IGZpZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGFkZGluZycpO1xuXG4gICAgaWYgKG9tYXJnaW4pIHtcbiAgICAgICAgcmV0dXJuIG9tYXJnaW4uc3BsaXQoJywnKS5tYXAoTnVtYmVyKTtcbiAgICB9XG5cbiAgICBzdmcgPSBzdmcgfHwgZ2V0S3lva3VtZW5TdmcoZmlnKTtcblxuICAgIHZhciBtYXJnaW4gPSBbMCwgMCwgMCwgMF07XG5cbiAgICBsZXQgc3R5bGUgPSBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKHN2ZywgbnVsbCk7XG5cbiAgICBtYXJnaW5bMF0gPSBwYXJzZUZsb2F0KHN0eWxlLnBhZGRpbmdUb3ApO1xuICAgIG1hcmdpblsxXSA9IHBhcnNlRmxvYXQoc3R5bGUucGFkZGluZ1JpZ2h0KTtcbiAgICBtYXJnaW5bMl0gPSBwYXJzZUZsb2F0KHN0eWxlLnBhZGRpbmdCb3R0b20pO1xuICAgIG1hcmdpblszXSA9IHBhcnNlRmxvYXQoc3R5bGUucGFkZGluZ0xlZnQpO1xuXG4gICAgcmV0dXJuIG1hcmdpbjtcbn1cblxuXG4vKipcbiAqIERyYXcgYSBzcXVhcmUgYW5kIGxpbmVzIGZvciBzaG9naS1iYW5cbiAqL1xuZnVuY3Rpb24gZHJhd0JhbihzdmcsIHdpZHRoLCBtYXJnaW4pIHtcbiAgICB2YXIgcmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAncmVjdCcpO1xuICAgIHJlY3Quc2V0QXR0cmlidXRlKCdjbGFzcycsICdiYW4nKTtcbiAgICByZWN0LnNldEF0dHJpYnV0ZSgneCcsIG1hcmdpblszXSk7XG4gICAgcmVjdC5zZXRBdHRyaWJ1dGUoJ3knLCBtYXJnaW5bMF0pO1xuICAgIHJlY3Quc2V0QXR0cmlidXRlKCd3aWR0aCcsIHdpZHRoKTtcbiAgICByZWN0LnNldEF0dHJpYnV0ZSgnaGVpZ2h0Jywgd2lkdGgpO1xuICAgIHN2Zy5hcHBlbmRDaGlsZChyZWN0KTtcblxuICAgIHZhciB3ID0gd2lkdGggLyBucm93O1xuXG4gICAgLy8g5qiq57eaXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBucm93OyBpKyspIHtcbiAgICAgICAgbGV0IGxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ2xpbmUnKTtcbiAgICAgICAgbGluZS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ3NlbicpO1xuICAgICAgICBsaW5lLnNldEF0dHJpYnV0ZSgneDEnLCBtYXJnaW5bM10pO1xuICAgICAgICBsaW5lLnNldEF0dHJpYnV0ZSgneDInLCBtYXJnaW5bM10gKyB3aWR0aCk7XG4gICAgICAgIGxpbmUuc2V0QXR0cmlidXRlKCd5MScsIG1hcmdpblswXSArIHcgKiBpKTtcbiAgICAgICAgbGluZS5zZXRBdHRyaWJ1dGUoJ3kyJywgbWFyZ2luWzBdICsgdyAqIGkpO1xuICAgICAgICBzdmcuYXBwZW5kQ2hpbGQobGluZSk7XG4gICAgfVxuXG4gICAgLy8g57im57eaXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBucm93OyBpKyspIHtcbiAgICAgICAgbGV0IGxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ2xpbmUnKTtcbiAgICAgICAgbGluZS5zZXRBdHRyaWJ1dGUoJ3gxJywgbWFyZ2luWzNdICsgdyAqIGkpO1xuICAgICAgICBsaW5lLnNldEF0dHJpYnV0ZSgneDInLCBtYXJnaW5bM10gKyB3ICogaSk7XG4gICAgICAgIGxpbmUuc2V0QXR0cmlidXRlKCdjbGFzcycsICdzZW4nKTtcbiAgICAgICAgbGluZS5zZXRBdHRyaWJ1dGUoJ3kxJywgbWFyZ2luWzBdKTtcbiAgICAgICAgbGluZS5zZXRBdHRyaWJ1dGUoJ3kyJywgbWFyZ2luWzBdICsgd2lkdGgpO1xuICAgICAgICBzdmcuYXBwZW5kQ2hpbGQobGluZSk7XG4gICAgfVxufVxuXG5cbi8qKlxuICogIERyYXcgOSAuLi4gMSBvbiB0b3AgbWFnaW5cbiAqL1xuZnVuY3Rpb24gZHJhd051bWJlcnNDb2woc3ZnLCB3aWR0aCwgbWFyZ2luKSB7XG4gICAgY29uc3Qgb2Zmc2V0TnVtQ29sID0ga3lva3VtZW5Kcy5vZmZzZXROdW1Db2wgfHwgMC4yNjtcblxuICAgIHZhciB3ID0gd2lkdGggLyBucm93O1xuICAgIGxldCBsYWJlbCA9IFsn77yZJywgJ++8mCcsICfvvJcnLCAn77yWJywgJ++8lScsICfvvJQnLCAn77yTJywgJ++8kicsICfvvJEnXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnJvdzsgaSsrKSB7XG4gICAgICAgIHZhciBudW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ3RleHQnKTtcbiAgICAgICAgbnVtLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnbnVtJyk7XG4gICAgICAgIG51bS5zZXRBdHRyaWJ1dGUoJ3gnLCBtYXJnaW5bM10gKyB3ICogKGkgKyAwLjUpKTtcbiAgICAgICAgbnVtLnNldEF0dHJpYnV0ZSgneScsIG1hcmdpblswXSAtIHcgKiBvZmZzZXROdW1Db2wpO1xuXG5cbiAgICAgICAgbnVtLnNldEF0dHJpYnV0ZSgndGV4dC1hbmNob3InLCAnbWlkZGxlJyk7XG4gICAgICAgIC8vbnVtLnNldEF0dHJpYnV0ZSgnZG9taW5hbnQtYmFzZWxpbmUnLCAnbWlkZGxlJyk7XG4gICAgICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobGFiZWxbaV0pO1xuICAgICAgICBudW0uYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgICAgIHN2Zy5hcHBlbmRDaGlsZChudW0pO1xuICAgIH1cbn1cblxuXG4vKipcbiAqICBEcmF3IOS4gOOAgeS6jOOAge+9pe+9pe+9peOAgeS5nSBvbiBsZWZ0IG1hcmdpblxuICovXG5mdW5jdGlvbiBkcmF3TnVtYmVyc1JvdyhzdmcsIHdpZHRoLCBtYXJnaW4pIHtcbiAgICBjb25zdCBvZmZzZXROdW1Sb3cgPSBreW9rdW1lbkpzLm9mZnNldE51bVJvdyB8fCAwLjU1O1xuICAgIHZhciB3ID0gd2lkdGggLyBucm93O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBucm93OyBpKyspIHtcbiAgICAgICAgdmFyIG51bSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAndGV4dCcpO1xuICAgICAgICBudW0uc2V0QXR0cmlidXRlKCdjbGFzcycsICdudW0nKTtcbiAgICAgICAgbnVtLnNldEF0dHJpYnV0ZSgneCcsIG1hcmdpblszXSArIHdpZHRoICsgdyAqIG9mZnNldE51bVJvdyk7XG4gICAgICAgIG51bS5zZXRBdHRyaWJ1dGUoJ3knLCBtYXJnaW5bMF0gKyB3ICogKGkgKyAwLjUpKTtcblxuICAgICAgICBudW0uc2V0QXR0cmlidXRlKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKTtcbiAgICAgICAgbnVtLnNldEF0dHJpYnV0ZSgnZG9taW5hbnQtYmFzZWxpbmUnLCAnY2VudHJhbCcpO1xuICAgICAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG51bUthbmppW2ldKTtcbiAgICAgICAgbnVtLmFwcGVuZENoaWxkKHRleHQpO1xuICAgICAgICBzdmcuYXBwZW5kQ2hpbGQobnVtKTtcbiAgICB9XG59XG4iLCJmdW5jdGlvbiBsb2FkRGVmYXVsdENTUyhmaWxlbmFtZSkge1xuICB2YXIgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgbGluay5ocmVmID0gZmlsZW5hbWU7XG4gIGxpbmsudHlwZSA9ICd0ZXh0L2Nzcyc7XG4gIGxpbmsucmVsID0gJ3N0eWxlc2hlZXQnO1xuXG4gIGxldCBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcblxuICBsZXQgZmlyc3RsaW5rID0gaGVhZC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGluaycpWzBdO1xuICBpZiAoZmlyc3RsaW5rKSB7XG4gICAgaGVhZC5pbnNlcnRCZWZvcmUobGluaywgZmlyc3RsaW5rKTtcbiAgfVxuICBlbHNlIHtcbiAgICBoZWFkLmFwcGVuZENoaWxkKGxpbmspO1xuICB9XG59XG5cbi8qXG4gKiBNYWluIGZ1bmN0aW9uIGZvciBkZWZhdWx0IHVzZVxuICovXG5mdW5jdGlvbiBtYWluKCkge1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGV2ZW50V2luZG93TG9hZGVkLCBmYWxzZSk7XG5cbiAgY29uc3QgZGVmYXVsdENTUyA9ICdodHRwczovL2p1bmtvZGEuZ2l0aHViLmlvL2t5b2t1bWVuLycgKyBreW9rdW1lbkpzLnZlciArICcva3lva3VtZW4uY3NzJztcblxuICBsb2FkRGVmYXVsdENTUyhkZWZhdWx0Q1NTKTtcblxuICBmdW5jdGlvbiBldmVudFdpbmRvd0xvYWRlZCgpIHtcbiAgICBzZXR1cChkb2N1bWVudC5ib2R5LCBudWxsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmF2ZXJzZSBET00gYW5kIHNldHVwIGt5b2t1bWVuIGFuZCBtb3Zlc1xuICAgKi9cbiAgZnVuY3Rpb24gc2V0dXAobm9kZSwgZmlnKSB7XG4gICAgaWYgKChub2RlLmNoaWxkcmVuIHx8IFtdKS5ub2RlVHlwZSA9PT0gMSlcbiAgICAgIHJldHVybiBmaWc7XG5cbiAgICBpZiAobm9kZS5jbGFzc05hbWUgPT09ICdreW9rdW1lbicpIHtcbiAgICAgIGZpZyA9IG5vZGU7XG4gICAgICBsZXQga3lva3VtZW4gPSBjcmVhdGVLeW9rdW1lbihmaWcpO1xuICAgICAga3lva3VtZW4uc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ga3lva3VtZW4ucmVzZXQoKSwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAobm9kZS5jbGFzc05hbWUgPT09ICdtdicpIHtcbiAgICAgIHZhciBtdiA9IGNyZWF0ZU12KG5vZGUsIGZpZyk7XG4gICAgICBpZiAobXYpXG4gICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgKCkgPT4gbXYuZHJhdygpLCBmYWxzZSk7XG4gICAgICBlbHNlXG4gICAgICAgIGNvbnNvbGUubG9nKCdFcnJvcjogdW5hYmxlIHRvIGNyZWF0ZSBtdiBpbiB0YWInLCBtdik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKylcbiAgICAgICAgZmlnID0gc2V0dXAobm9kZS5jaGlsZHJlbltpXSwgZmlnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmlnO1xuICB9XG59XG5cbm1haW4oKTtcbiIsImNsYXNzIE12IHtcbiAgICBjb25zdHJ1Y3RvcihreW9rdW1lbiwgc2Zlbiwgc2VudGUsIGdvdGUsIHRpdGxlLCBmb2N1cykge1xuICAgICAgICB0aGlzLmt5b2t1bWVuID0ga3lva3VtZW47XG4gICAgICAgIHRoaXMuc2ZlbiA9IHNmZW47XG4gICAgICAgIHRoaXMuc2VudGUgPSBzZW50ZTtcbiAgICAgICAgdGhpcy5nb3RlID0gZ290ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRpdGxlO1xuICAgICAgICB0aGlzLmZvY3VzID0gcGFyc2VDb29yZGluYXRlKGZvY3VzKTtcbiAgICB9XG5cbiAgICBkcmF3KCkge1xuICAgICAgICB0aGlzLmt5b2t1bWVuLmRyYXcodGhpcy5zZmVuLCB0aGlzLnNlbnRlLCB0aGlzLmdvdGUsIHRoaXMudGl0bGUsIHRoaXMuZm9jdXMpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZXR1cm4gPGZpZ3VyZSBjbGFzcz1cImt5b2t1bWVuXCI+IG9iamVjdCAtLSBreW9rdW1lbkZpZ1xuICogV2hlbiBvIGlzIGEgY2xhc3M9XCJtdlwiLCByZXR1cm4gdGhlIGt5b2t1bWVuRmlnIHNwZWNpZmllZCBieSB0aGUgJ2RhdGEtYm9hcmQnXG4gKiBXaGVuIG8gaXMgaXRzZWxmIGEgZmlndXJlIG9wamVjdCByZXR1cm4gby5cbiAqL1xuZnVuY3Rpb24gZ2V0RmlnKG8pIHtcbiAgICBpZiAoby50YWdOYW1lID09ICdGSUdVUkUnKVxuICAgICAgICByZXR1cm4gbztcblxuICAgIHZhciBib2FyZGlkID0gby5nZXRBdHRyaWJ1dGUoJ2RhdGEtYm9hcmQnKTtcbiAgICBpZiAoIWJvYXJkaWQpXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgICB2YXIga3lva3VtZW5GaWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChib2FyZGlkKTtcbiAgICBpZiAoIWt5b2t1bWVuRmlnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdFcnJvcjogYm9hcmQgbm90IGZvdW5kIHdpdGggaWQ9ICcgKyBib2FyZGlkKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4ga3lva3VtZW5GaWc7XG59XG5cbi8qXG4gKiBDcmVhdGUgYSBtdiBvYmplY3QgZnJvbSBlID0gPHNwYW4gY2xhc3M9XCJtdlwiIGRhdGEtc2Zlbj1cIi4uLlwiIC4uLj5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlTXYoZSwgZmlnKSB7XG4gICAgZmlnID0gZ2V0RmlnKGUpIHx8IGZpZztcbiAgICBpZiAoIWZpZykgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgIHZhciBreW9rdW1lbiA9IGZpZy5reW9rdW1lbjtcblxuICAgIHZhciBzZmVuID0gZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtc2ZlbicpO1xuICAgIGlmICghc2Zlbikge1xuICAgICAgICBjb25zb2xlLmxvZygnRXJyb3I6IHVuYWJsZSB0byBnZXQgc2ZlbiBpbiBtb3ZlOicpO1xuICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICB9XG5cbiAgICBjb25zdCBzZW50ZSA9IGUuZ2V0QXR0cmlidXRlKCdkYXRhLXNlbnRlJykgfHwgZmlnLmdldEF0dHJpYnV0ZSgnZGF0YS1zZW50ZScpO1xuICAgIGNvbnN0IGdvdGUgPSBlLmdldEF0dHJpYnV0ZSgnZGF0YS1nb3RlJykgfHwgZmlnLmdldEF0dHJpYnV0ZSgnZGF0YS1nb3RlJyk7XG4gICAgY29uc3QgdGl0bGUgPSBlLmdldEF0dHJpYnV0ZSgnZGF0YS10aXRsZScpIHx8IGZpZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGl0bGUnKTtcbiAgICBjb25zdCBmb2N1cyA9IGUuZ2V0QXR0cmlidXRlKCdkYXRhLW1hZGUnKTtcblxuICAgIHJldHVybiBuZXcgTXYoa3lva3VtZW4sIHNmZW4sIHNlbnRlLCBnb3RlLCB0aXRsZSwgZm9jdXMpO1xufVxuIl19
