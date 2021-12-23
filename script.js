var ce = React.createElement;

function toPiece(str) {
	if(str.length != 4) {
		console.error('argument must have 4 characters: symbol color file rank');
	}
	return {symbol: str.charAt(0), color: str.charAt(1), file:str.charAt(2), rank: +str.charAt(3) }
}

function makeInitialPieceList() {
	var res = [];
	for(var i = 0; i < 8; i++) {
		res.push({color: 'W', symbol:'P', file: String.fromCharCode(65+i), rank: 2});
	}
	for(var i = 0; i < 8; i++) {
		res.push({color: 'B', symbol:'P', file: String.fromCharCode(65+i), rank: 7});
	}
	'RNBQKBNR'.split('').forEach((symbol, i)=>{
		var file = String.fromCharCode(65+i);
		res.push({color: 'W', symbol,  file, rank:  1 });
		res.push({color: 'B', symbol,  file, rank: 8 });

	} );
	return res; 
}



function makeInitialUnmovedKingRookList() {
	var res = ['KWE1','RWA1','RWH1'].flatMap((s,i)=> {
		var p1 = toPiece(s);
		var p2 = {...p1};
		p2.rank = 8;
		p2.color =  'B';
		return [p1,p2];
	});
	return res;
}


var GameContext = React.createContext(makeInitialPieceList());



class Square extends React.Component {
	
	constructor(props) {
		super(props);
		this.handleDragOver = this.handleDragOver.bind(this);
		this.handleDrop = this.handleDrop.bind(this);
		// this.state = {};
	}

	
	handleDragOver(evt) {
		evt.preventDefault();
	}

	handleDrop(evt,context) {
		evt.preventDefault();
		var dataTransfer;
		try {
			dataTransfer = JSON.parse(evt.dataTransfer.getData('application/json'));		
			context.move(dataTransfer.piece,{rank: this.props.rank, file: this.props.file}, context);
		} catch(e) {
			console.debug(evt.dataTransfer.getData('application/json'));
		}
	}

	render() {
		return ce(GameContext.Consumer, {}, (context)=>{
			var piece = findPieceAt({file: this.props.file, rank: this.props.rank}, context.pieceList);
			var pieceElement;
			if(piece) {
				pieceElement = ce(Piece, {piece });
			}

			return ce('div',{className: 'square', 'data-color': this.props.color, onDragOver: this.handleDragOver, onDrop: (evt)=>this.handleDrop(evt,context)}, pieceElement);
		});		
	}
}


class Piece extends React.Component {
	// https://we.tl/t-7poXeEHGxA
	constructor(props) {
		super(props);
		this.handleDragStart = this.handleDragStart.bind(this);
	}

	handleDragStart(evt) {
		evt.dataTransfer.setData('application/json', JSON.stringify({piece: this.props.piece}));
	}

	symbolToUnicode() {
		var pieceList = ['K','Q','R','B','N','P'];
		var index =  pieceList.indexOf(this.props.piece.symbol);
		return String.fromCharCode((this.props.piece.color == 'W'?0x2654:0x265A) + index);

	}

	render() {
		return ce('span', {className: 'piece', 'data-color': this.props.piece.color, draggable: true, onDragStart: this.handleDragStart}, this.symbolToUnicode());
	}
}

/* This Component contains a list of choosable pieces for the next promotion */
class PromotionPalette extends React.Component  {

	constructor(props) {
		super(props);
	}

	render() {
		var title = ce('div',{key:'title',className:'title'},'Promote to');
		return ce(GameContext.Consumer, {}, (context)=>{
			return ce('div', {className:"promotionPalette"}, [title].concat(['Q','R','B','N'].map((symbol)=>{
				var piece = ce(Piece,{key:symbol, piece: {symbol:symbol,color: this.props.color}});
				return ce('div', {className:'square',key:symbol, "data-selected": context.promotionSymbol == symbol, onClick: ()=>{ context.setPromotionSymbol(symbol) } }, piece);
			})));

		} )
	}
}

function ScoreSheet(props)  {
	return ce(GameContext.Consumer, {}, (context)=>
		ce('div',{},
			ce('table',{className:'scoreSheet'}, [
				ce('caption',{key:'caption'},'ScoreSheet'),
				ce('thead',{key:'thead'},
					ce('tr', {}, ['white','black'].map(color=>ce('th',{key:color}, color)))
				),
				ce('tbody', {key:'tbody'} ,Array.from({length: Math.ceil(props.scoreSheet.length/2)}, (o,i)=>
					ce('tr',{key:'tr'+i, className:'tr'+i}, [props.scoreSheet[i*2], props.scoreSheet[i*2+1]].map((move,j)=>
						ce('td', {key: i+''+j}, move)
					))
				)),
				(context.result?ce('tfoot',{key:'tfoot'},ce('tr',{},ce('td',{colSpan:2},context.result.code))):undefined)
			])
		)
	);
}



class ChessBoard extends React.Component {

	constructor(props) {
		super(props);
		var initialPieceList =makeInitialPieceList();
		var initialUnmovedKingRookList = makeInitialUnmovedKingRookList();
		this.state = {
			pieceList: initialPieceList,
			unmovedKingRookList: initialUnmovedKingRookList,
			turn:'W',
			promotionSymbol:'Q',
			justArrivedFourthRankPawn: undefined,
			scoreSheet: [],
			result: undefined,
			movesSincePushCapture: 0,
			moveNo: 0,
			positionList: [{pieceList: initialPieceList, unmovedKingRookList: initialUnmovedKingRookList, turn:'W'}],
			setPromotionSymbol:  (symbol)=>{
				this.setState({promotionSymbol:symbol});
			},
			move: (movedPiece, destination, context)=> {
				this.setState((state,props)=> {
					// alternate turn
					if(movedPiece.color != state.turn) { 
						return {pieceList: state.pieceList};
					}

					return applyMoveToContext(movedPiece, destination, context);
					
				});
			}
		};
	}

	

	render() {
		var squareList = [];
		for(var i = 0; i < 8; i++) {
			for(var j = 0; j < 8; j++) {
				var color = (i%2 == j%2)?'white':'black';
				var file = String.fromCharCode(j + 65);
				var rank = 8-i ;
				squareList.push(ce(Square, {key:file+rank , rank, file, color }));
			}
		}
		var scoreSheet = this.state.scoreSheet;
		return ce(GameContext.Provider, {value: this.state},  [
			// ce(PromotionPalette,{color:'W', key:'W'}),
			ce('div', {className:"board", key:'board'}, squareList),
			ce(PromotionPalette,{color:'B', key:'B'}),
			ce(ScoreSheet, {key: 'scoreSheet', scoreSheet: scoreSheet})
		]);
	}
}

function findPieceAt(sq, pieceList) {
	return pieceList.find((piece,i)=> {
		return piece.rank == sq.rank && piece.file == sq.file;
	});
}

function pieceEquals(p1,p2) {
	if(!p1 && !p2) { return true; }
	if(p1 && !p2 || !p1 && p2) { return false; }
	return p1.color == p2.color && p1.symbol == p2.symbol && p1.file == p2.file && p1.rank == p2.rank;
}

window.addEventListener('load', (loadEvt)=>{
	ReactDOM.render(ce(ChessBoard, {}), document.querySelector('main'));
});


/*https://www.davidbcalhoun.com/2014/what-is-amd-commonjs-and-umd/*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function () {
    
    //    exposed public methods
    return {
        findPieceAt: findPieceAt 
    }
}));