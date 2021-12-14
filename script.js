var ce = React.createElement;

function toPiece(str) {
	if(str.length != 4) {
		console.error('argument must have 4 characters: symbol color file rank');
	}
	return {symbol: str.charAt(0), color: str.charAt(1), file:str.charAt(2), rank: +str.charAt(3) }
}

/*function makeInitialPieceList() {
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
}*/

function makeInitialPieceList() {
	return [
		{color:'W',symbol:'K',file:'E',rank:8},
		{color:'B',symbol:'K',file:'G',rank:8},
		{color:'B',symbol:'P',file:'A',rank:2},
		{color:'W',symbol:'N',file:'B',rank:4},
	];
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
		} catch(e) {
			console.debug(evt.dataTransfer.getData('application/json'));
		}
		context.move(dataTransfer.piece,{rank: this.props.rank, file: this.props.file}, context);
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

	

	render() {
		return ce('span', {className: 'piece', 'data-color': this.props.piece.color, draggable: true, onDragStart: this.handleDragStart}, this.props.piece.symbol);
	}
}

/* This Component contains a list of choosable pieces for the next promotion */
class PromotionPalette extends React.Component  {

	constructor(props) {
		super(props);
	}

	render() {
		return ce(GameContext.Consumer, {}, (context)=>{
			return ce('div', {className:"promotionPalette"}, ['Q','R','B','N'].map((symbol)=>{
				var piece = ce(Piece,{key:symbol, piece: {symbol:symbol,color: this.props.color}});
				return ce('div', {className:'square',key:symbol, "data-selected": context.promotionSymbol == symbol, onClick: ()=>{ context.setPromotionSymbol(symbol) } }, piece);
			}));

		} )
	}
}



class ChessBoard extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			pieceList: makeInitialPieceList(),
			unmovedKingRookList: makeInitialUnmovedKingRookList(),
			turn:'W',
			promotionSymbol:'Q',
			justArrivedFourthRankPawn: undefined,
			movesSincePushCapture: 0,
			moveNo: 0,
			setPromotionSymbol:  (symbol)=>{
				this.setState({promotionSymbol:symbol});
			},
			move: (movedPiece, destination, context)=> {
				this.setState((state,props)=> {
					// alternate turn
					if(movedPiece.color != state.turn) { 
						return {pieceList: state.pieceList};
					}


					/*var updatedPieceList = isLegal(movedPiece, destination, context);

					var justArrivedFourthRankPawn = context.justArrivedFourthRankPawn;
					if(updatedPieceList) {
						if(movedPiece == 'P' && ((movedPiece.color == 'W' && destination.rank == 5) || (movedPiece.color == 'B' && destination.rank == 4) ) ) {
							justArrivedFourthRankPawn = movedPiece;	
						} else {
							justArrivedFourthRankPawn = undefined;
						}

					}
					var res = {
						pieceList: updatedPieceList,
						justArrivedFourthRankPawn: justArrivedFourthRankPawn,
						turn: state.turn=='W'?'B':'W'
					};


					if(updatedPieceList) {
						return res;
					} else {
						return {};
					}*/


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
		return ce(GameContext.Provider, {value: this.state},  [
			// ce(PromotionPalette,{color:'W', key:'W'}),
			ce('div', {className:"board", key:'board'}, squareList),
			ce(PromotionPalette,{color:'B', key:'B'})
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