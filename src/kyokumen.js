/**
 * kyokumen.js: A library for shogi documents on the web
 * Author:      Jun Koda (2016)
 * Website:     https://github.com/junkoda/kyokumen
 */

const kyokumenJs = {
    ver: '0',
    senteMark: '☗',
    goteMark: '☖',
    maxDuplicate: 3,
    handOffset: 0.1,
    offsetNumCol: 0.26,
    offsetNumRow: 0.55
};

const nrow = 9;
const Piece = { l:'香', n:'桂', s:'銀', g:'金', k:'玉', r:'飛', b:'角', p:'歩', '+l':'成香', '+n':'成桂', '+s':'成銀', '+r':'龍', '+b':'馬', '+p':'と'};
const numKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八'];

/*
 * API of kyokumen.js usable by other codes
 */
kyokumenJs.createKyokumen = createKyokumen; // create a kyokumen in figure
kyokumenJs.Kyokumen = function(svg, width, margin) {
    let kyokumen = new Kyokumen(svg, width, margin, '');

    drawBan(svg, width, margin);        // Box and lines
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
        const ix = parseInt(s[0]);
        const iy = parseInt(s[1]);

        if (ix && iy) return [ix, iy];
    }

    return null;
}

/**
 * kyokumen object constructor
 */
class Kyokumen {

    constructor(svg, width, margin, sfen, sente, gote, title, focus) {
        this.svg = svg;
        this.width = width;
        this.margin = margin;
        this.sfen = sfen;
        this.sente = sente;
        this.gote = gote;
        this.title = title;
        this.focus = parseCoordinate(focus);
    }

    clear() {
        this.clearKyokumen('koma');
        this.clearKyokumen('nari-goma');
        this.clearKyokumen('sente');
        this.clearKyokumen('gote');
        this.clearKyokumen('title');
    };

    /**
     * Remove class=cls child elements from kyokumen
     * Args:
     *     kyokumen: a DOM element
     *     cls (string): class name 'koma', 'nari-goma', ...
     */
    clearKyokumen(cls) {
        let komas = this.svg.getElementsByClassName(cls);
        while (komas.length > 0) {
            this.svg.removeChild(komas[0]);
            komas = this.svg.getElementsByClassName(cls);
        }
    }

    draw(sfen, sente, gote, title, focus) {
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
    };

    /**
     * Returns true if the character is lower case.
     * True for 'p', '+p', 'l', ...
     * False for 'P', '+P', 'L', ...
     */
    isGote(c) {
        return c == c.toLowerCase();
    }

    senteLabel(name) {
        const w = this.width / nrow;
        const x = this.margin[3] + this.width + w + (this.margin[1] - w) / 2;
        const y = this.margin[0] + this.width - kyokumenJs.handOffset * w;
        let label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'sente');
        label.setAttribute('x', x);
        label.setAttribute('y', y);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('dominant-baseline', 'central');
        if (!name)
            name = ' 先手 ';
        else
            name = ' ' + name + ' ';
        label.appendChild(this.komark(kyokumenJs.senteMark));
        label.appendChild(document.createTextNode(name));
        return label;
    }

    goteLabel(name) {
        const x = this.margin[3] / 2;
        const y = this.margin[0];
        let label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'gote');
        label.setAttribute('x', x);
        label.setAttribute('y', y);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('dominant-baseline', 'central');
        label.setAttribute('transform', `rotate(180 ${x} ${y})`);

        if (!name)
            name = ' 後手 ';
        else
            name = ' ' + name + ' ';
        label.appendChild(this.komark(kyokumenJs.goteMark));
        label.appendChild(document.createTextNode(name));

        return label;
    }

    /**
     * Draw <svg sente='☗先手'> atrribute with Sente's pieces in hand.
     */
    drawSente(sfen, name, i) {
        var n = sfen.length;
        let label = this.senteLabel(name);
        let iPiece = 0;
        let tspan = function(p, i) {
            let pt = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            pt.appendChild(document.createTextNode(Piece[p.toLowerCase()]));
            pt.setAttribute('class', 'sente-piece-hand');
            pt.setAttribute('data-i', i);
            pt.setAttribute('data-p', p.toLowerCase());
            return pt;
        };
        while (i < n) {
            var p = sfen.charAt(i);
            if (p === '-' || p === ' ')
                break;

            const number = parseInt(sfen.substring(i, n));
            if (number) {
                p = sfen.charAt(i + String(number).length);
                if (this.isGote(p)) break;
                if (p && number < kyokumenJs.maxDuplicate) {
                    for (var j = 1; j < number; j++) {
                        label.appendChild(tspan(p, iPiece));
                    }
                }
                else if (p) {
                    label.appendChild(document.createTextNode(numKanji[number - 1]));
                    iPiece += number - 1;
                }
                i += String(number).length;
            }
            else if (this.isGote(p)) {
                break;
            }
            label.appendChild(tspan(p, iPiece));
            i++;
            iPiece++;
        }

        this.svg.appendChild(label);

        return i;
    }

    komark(mark) {
        let e = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        e.setAttribute('class', 'komark');
        e.appendChild(document.createTextNode(mark));
        return e;
    }

    /**
     * Draw <svg gote='☖後手'> attribute with Gote's pieces in hand.
     */
    drawGote(sfen, name, i) {
        let n = sfen.length;
        let label = this.goteLabel(name);
        let iPiece = 0;
        let tspan = function(p, i) {
            let pt = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            pt.appendChild(document.createTextNode(Piece[p.toLowerCase()]));
            pt.setAttribute('class', 'gote-piece-hand');
            pt.setAttribute('data-i', i);
            pt.setAttribute('data-p', p.toLowerCase());
            return pt;
        };
        while (i < n) {
            let p = sfen.charAt(i);

            if (!p || p === '-' || p === ' ') {
                i++;
                break;
            }

            const number = parseInt(sfen.substring(i, n));
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
    drawPieces(sfen, sente, gote, focus) {
        // e.g. sfen='lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b'>
        // for example for initial

        const width = this.width;

        const w = width / nrow;
        const n = sfen.length;

        // Pices on board
        var i;
        var ix = 0;
        var iy = 0;

        for (i = 0; i < n; i++) {
            let p = sfen.charAt(i);
            if (p == '+') {
                p = sfen.substring(i, i + 2);
                i++;
            }

            const number = Number(p);
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
                const emp = focus && focus[0] == 9 - ix && focus[1] == 1 + iy;
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
    drawPiece(w, ix, iy, p, emp) {
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
                var transformation = `translate(${x} ${y})`;
                if (pieceText.length == 2) {
                    // Shrink the height of Gote's 成香、成桂、成銀
                    transformation += ' scale(1.0 0.5)';
                }
                transformation += 'rotate(180)';
                transformation += `translate(${-x} ${-y})`;

                piece.setAttribute('transform', transformation);
            }
            else if (pieceText.length == 2) {
                // Shrink the height of Sente's 成香、成桂、成銀
                let transformation = `translate(${x} ${y})`;
                transformation += ' scale(1.0 0.5)';
                transformation += `translate(${-x} ${-y})`;
                piece.setAttribute('transform', transformation);
            }

            piece.setAttribute('text-anchor', 'middle');
            piece.setAttribute('dominant-baseline', 'central');
            var text;

            if (emp) {
                text = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                text.setAttribute('class', 'made');
                text.appendChild(document.createTextNode(pieceText));
            }
            else
                text = document.createTextNode(pieceText);

            piece.appendChild(text);
            this.svg.appendChild(piece);
        }
        else {
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
    skipTeban(sfen, i) {
        i = this.skipSpace(sfen, i);

        var n = sfen.length;
        if (i < n) {
            let p = sfen.charAt(i);
            if (p == 'b' || p == 'w') {
                i++;
            } else {
                console.log('Error: teban b or w not found');
            }
        }

        i = this.skipSpace(sfen, i);

        return i;
    }


    skipSpace(sfen, i) {
        let n = sfen.length;
        while (i < n) {
            if (sfen.charAt(i) === ' ')
                i++;
            else
                break;
        }
        return i;
    }

    drawTitle(title) {
        if (title) {
            const w = this.width / nrow;
            const x = this.margin[3] + this.width / 2;
            const y = (this.margin[0] - w) / 2;
            let label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('class', 'title');
            label.setAttribute('x', x);
            label.setAttribute('y', y);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dominant-baseline', 'central');

            label.appendChild(document.createTextNode(title));
            this.svg.appendChild(label);
        }
    }

    reset() {
        this.draw();
    }
}

/*
 * Create a kyokumen object from fig = <figure class="kyokumen" sfen="...">
 */
function createKyokumen(fig) {
    var svg = createKyokumenSvg(fig);
    const width = getWidth(fig, svg);
    const margin = getPadding(fig, svg);
    const sfen = fig.getAttribute('data-sfen') || '';
    const sente = fig.getAttribute('data-sente');
    const gote = fig.getAttribute('data-gote');
    const title = fig.getAttribute('data-title');
    const focus = fig.getAttribute('data-made');
    // sente, gote can be falsy, default will be used.

    svg.style.width = String(width + margin[1] + margin[3]) + 'px';
    svg.style.height = String(width + margin[0] + margin[2]) + 'px';
    svg.style.padding = '0';

    let kyokumen = new Kyokumen(svg, width, margin, sfen, sente, gote, title, focus);

    drawBan(svg, width, margin);        // Box and lines
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
    const owidth = fig.getAttribute('data-width');
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
    const omargin = fig.getAttribute('data-padding');

    if (omargin) {
        return omargin.split(',').map(Number);
    }

    svg = svg || getKyokumenSvg(fig);

    var margin = [0, 0, 0, 0];

    let style = document.defaultView.getComputedStyle(svg, null);

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
        let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'sen');
        line.setAttribute('x1', margin[3]);
        line.setAttribute('x2', margin[3] + width);
        line.setAttribute('y1', margin[0] + w * i);
        line.setAttribute('y2', margin[0] + w * i);
        svg.appendChild(line);
    }

    // 縦線
    for (var i = 1; i < nrow; i++) {
        let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', margin[3] + w * i);
        line.setAttribute('x2', margin[3] + w * i);
        line.setAttribute('class', 'sen');
        line.setAttribute('y1', margin[0]);
        line.setAttribute('y2', margin[0] + width);
        svg.appendChild(line);
    }
}


/**
 *  Draw 9 ... 1 on top magin
 */
function drawNumbersCol(svg, width, margin) {
    const offsetNumCol = kyokumenJs.offsetNumCol || 0.26;

    var w = width / nrow;
    let label = ['９', '８', '７', '６', '５', '４', '３', '２', '１'];

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
    const offsetNumRow = kyokumenJs.offsetNumRow || 0.55;
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
