class Mv {
    constructor(kyokumen, sfen, sente, gote, title, focus) {
        this.kyokumen = kyokumen;
        this.sfen = sfen;
        this.sente = sente;
        this.gote = gote;
        this.title = title;
        this.focus = parseCoordinate(focus);
    }

    draw() {
        this.kyokumen.draw(this.sfen, this.sente, this.gote, this.title, this.focus);
    }
}

/**
 * Return <figure class="kyokumen"> object -- kyokumenFig
 * When o is a class="mv", return the kyokumenFig specified by the 'data-board'
 * When o is itself a figure opject return o.
 */
function getFig(o) {
    if (o.tagName == 'FIGURE')
        return o;

    var boardid = o.getAttribute('data-board');
    if (!boardid)
        return undefined;

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

    const sente = e.getAttribute('data-sente') || fig.getAttribute('data-sente');
    const gote = e.getAttribute('data-gote') || fig.getAttribute('data-gote');
    const title = e.getAttribute('data-title') || fig.getAttribute('data-title');
    const focus = e.getAttribute('data-made');

    return new Mv(kyokumen, sfen, sente, gote, title, focus);
}
