function findPieceAt(sq, pieceList) {
	return pieceList.find((piece,i)=> {
		return piece.rank == sq.rank && piece.file == sq.file;
	});
}

function makeInitialUnmovedKingRookList() {
	var res = ['KWE1','RWA1','RWH1'].flatMap((s,i)=> {
		var p1 = toPiece(s);
		var p2 = {...p1};
		p2.color =  'B';
		return [p1,p2];
	});
	return res;
}


function isLegal(movingPiece, destination, context) {
	var range = getPieceRange(movingPiece, context);
	var possible = range.some((sq)=>{return sq.rank == destination.rank && sq.file == destination.file});

	if(isCastlingIntended(movingPiece,destination,context) && isCastlingLegal(movingPiece,destination,context)) {
		return performCastling();
	}

	if(possible) {


		// remove captured piece
		var updatedPieceList = context.pieceList.filter((piece,i)=> {
			var captured = (piece.symbol != 'K' && piece.rank == destination.rank && piece.file == destination.file);
			// if(captured) {
			// 	console.log(piece);
			// }
			return !captured;
		});

		updatedPieceList =  updatedPieceList.map((piece,i)=> {
			if( pieceEquals(movingPiece,piece) ) { // update movedPiece
				movingPiece.rank = destination.rank;
				movingPiece.file = destination.file;
				return movingPiece;
			}

			return piece;

		});


		if(isColorUnderCheck(movingPiece.color, {pieceList: updatedPieceList})) {
			console.log('check in new square');
			// return {};
			return false;
		} else {

			var opponentUnderCheck =  isColorUnderCheck()
			return updatedPieceList;
		}
	}
	return false;
}



function applyMoveToContext(movingPiece, destination, context) {
	var range = getPieceRange(movingPiece, context);
	var possible = range.some((sq)=>{return sq.rank == destination.rank && sq.file == destination.file});

	if(possible) {

		var updatedPieceList = applyMoveToPieceListSansVerif(movingPiece, destination, context);

		var justArrivedFourthRankPawn = (movingPiece == 'P' && ((movingPiece.color == 'W' && destination.rank == 5) || (movingPiece.color == 'B' && destination.rank == 4) ));
		var updatedContext = {pieceList: updatedPieceList, justArrivedFourthRankPawn: justArrivedFourthRankPawn};

		var promotion = movingPiece.symbol == 'P' && (destination.rank == 8 && movingPiece.color == 'W' || destination.rank == 1 && movingPiece.color == 'B');
		if(promotion) {
			updatedContext.pieceList = updatedContext.pieceList.map((p)=>{
				if(p.symbol == 'P' && (p.rank == 8 || p.rank == 1 )) {
					p.symbol = context.promotionSymbol;
					return p; 
				}
				return p
			});
		}

		if(['K','R'].includes(movingPiece.symbol)) {
			updatedContext.unmovedKingRookList = context.unmovedKingRookList.filter((p)=>{
				return !pieceEquals(movingPiece,p);
			});
		} 

		performCastling(movingPiece, destination, context);


		if(isColorUnderCheck(movingPiece.color, updatedContext )) {
			console.log('check in new square');
			return {};
		} else {
			updatedContext.turn = context.turn == 'W'?'B':'W';

			var enemy = movingPiece.color == 'W'?'B':'W';
			var enemyPossibleMoves = getTotalPossibleMoves(enemy, updatedContext);
			

			// no problem

			// pb is every not applyMoveToPieceListSansVerif
			var enemyHasNoMoveLeft =  enemyPossibleMoves.every((pm)=>{
				var overUpdatedContext = {pieceList: applyMoveToPieceListSansVerif(pm.piece, {rank: pm.rank, file: pm.file}, {pieceList: clonePieceList(updatedContext.pieceList)}) };
				return isColorUnderCheck(enemy, overUpdatedContext);
			});

			if(isColorUnderCheck(enemy, updatedContext)) { // enemy under check
				if(enemyHasNoMoveLeft) {
					console.log('checkmate for ' + enemy);
				}
			}

			return updatedContext;
		}
	}
	return {};	
}

function applyMoveToPieceListSansVerif(movingPiece, destination, context) {

	// remove captured piece
	var updatedPieceList = clonePieceList(context.pieceList).filter((piece,i)=> {
		var captured = (piece.symbol != 'K' && piece.rank == destination.rank && piece.file == destination.file);
		return !captured;
	});


	// update movedPiece
	updatedPieceList =  clonePieceList(updatedPieceList).map((piece,i)=> {
		if( pieceEquals(movingPiece,piece) ) { 
			piece.rank = destination.rank;
			piece.file = destination.file;

			return piece;
		}
		return piece;
	});


	
	return updatedPieceList;
}

function isColorUnderCheck(color, context ) {
	var enemy = (color == 'W')?'B':'W';
	var king = context.pieceList.find((p)=>p.symbol == 'K' && p.color == color);
	var pmList = getTotalPossibleMoves(enemy, context);
	var res =  includesSquare(pmList, {rank: king.rank, file: king.file});
	return res;
}

// does not consider if move results in color being under check
function getTotalPossibleMoves(color ,context) {
	return context.pieceList.slice().flatMap((p,i)=> {
		if(p.color == color) {
			var range = getPieceRange(p, context);
			var moveList = range.map((sq)=>{ return {piece:p, ...sq}; } ); 
			return moveList;
		}
		return [];
	});
}


function getPieceRange(piece, context) {
	var possible = [];
	if(piece.symbol == 'P') {
		possible = getPawnRange(piece,context);
	}
	if(piece.symbol == 'N') {
		possible = getKnightRange(piece,context);
	}
	if(piece.symbol == 'B') {
		possible = getBishopRange(piece,context);
	}
	if(piece.symbol == 'R') {
		possible = getRookRange(piece,context);
	}
	if(piece.symbol == 'Q') {
		possible = getQueenRange(piece,context);
	}
	if(piece.symbol == 'K') {
		possible = getKingRange(piece,context);
	}
	return possible;
}

function getRookRange(rook, context) {
	var res = [];
	var i;
	// forward
	for(i = rook.rank + 1; i <= 8; i++) {
		var p = findPieceAt({rank: i, file: rook.file}, context.pieceList);
		if(p) {
			if(p.color != rook.color) {
				res.push({rank: i, file: rook.file});
			}
			break;
		} else {
			res.push({rank: i, file: rook.file});
		}
	}
	// backward
	for(i = rook.rank - 1; i >= 1; i--) {
		var p = findPieceAt({rank: i, file: rook.file}, context.pieceList);
		if(p) {
			if(p.color != rook.color) {
				res.push({rank: i, file: rook.file});
			}
			break;
		} else {
			res.push({rank: i, file: rook.file});
		}
	}

	// right
	for(i = rook.file.charCodeAt(0) + 1; i <= 'H'.charCodeAt(0); i++) {
		var sq = {rank: rook.rank, file: String.fromCharCode(i)};
		var p = findPieceAt(sq, context.pieceList);
		if(p) {
			if(p.color != rook.color) {
				res.push(sq);
			}
			break;
		} else {
			res.push(sq);
		}
	}

	// left
	for(i = rook.file.charCodeAt(0) - 1; i >= 'A'.charCodeAt(0); i--) {
		var sq = {rank: rook.rank, file: String.fromCharCode(i)};
		var p = findPieceAt(sq, context.pieceList);
		if(p) {
			if(p.color != rook.color) {
				res.push(sq);
			}
			break;
		}	else {
			res.push(sq);
		}
	}

	return res;
}  


function getBishopRange(bishop, context) {
	var res = [];

	// top right
	for(let i = bishop.rank+1, j = bishop.file.charCodeAt(0)+1; i <= 8 && j <= 'H'.charCodeAt(0); i++, j++) {
		var sq = {rank: i, file: String.fromCharCode(j)};
		var p = findPieceAt(sq, context.pieceList);
		if(p) {
			if(p.color != bishop.color) {
				res.push(sq);
			}
			break;
		} else {
			res.push(sq);
		} 
	}

	// top left
	for(let i = bishop.rank+1, j = bishop.file.charCodeAt(0)-1; i <= 8 && j >= 'A'.charCodeAt(0); i++, j--) {
		var sq = {rank: i, file: String.fromCharCode(j)};

		var p = findPieceAt(sq, context.pieceList);

		if(p) {
			if(p.color != bishop.color) {
				res.push(sq);
			}
			break;
		} else {
			res.push(sq);
		}
	}

	// bottom left

	for(let i = bishop.rank-1, j = bishop.file.charCodeAt(0)-1; i >= 1 && j >= 'A'.charCodeAt(0); i--, j--) {
		var sq = {rank: i, file: String.fromCharCode(j)};
		var p = findPieceAt(sq, context.pieceList);
		if(p) {
			if(p.color != bishop.color) {
				res.push(sq);
			}
			break;
		} else {
			res.push(sq);
		}	
	}

	// bottom right

	for(let i = bishop.rank-1, j = bishop.file.charCodeAt(0)+1; i >= 1 && j <= 'H'.charCodeAt(0); i--, j++) {
		var sq = {rank: i, file: String.fromCharCode(j)};
		var p = findPieceAt(sq, context.pieceList);
		if(p) {
			if(p.color != bishop.color) {
				res.push(sq);
			}
			break;
		} else {
			res.push(sq);
		}	
	}

	return res;
}

function getQueenRange(queen, context) {
	return getRookRange(queen,context).concat(getBishopRange(queen,context));
}

function getKnightRange(knight, context) {
	var res = [];
	var f = knight.file.charCodeAt(0);
	var r = knight.rank;
	res.push({file: f + 1, rank: r + 2});
	res.push({file: f + 1, rank:r - 2});
	res.push({file: f - 1, rank:r - 2});
	res.push({file: f - 1, rank:r + 2});
	res.push({file: f + 2, rank:r + 1});
	res.push({file: f + 2, rank:r - 1});
	res.push({file: f - 2, rank:r + 1});
	res.push({file: f - 2, rank:r - 1});
	res = res.filter((sq,i)=>{

		if( sq.rank >= 1 && sq.rank <= 8 && sq.file >= 'A'.charCodeAt(0) && sq.file <= 'H'.charCodeAt(0)) {
			var p = findPieceAt({ rank: sq.rank, file: String.fromCharCode(sq.file)}, context.pieceList);
			return !p || p.color != knight.color;
		} else {
			return false;
		}
	}).map((sq,i)=>{
		return {file: String.fromCharCode(sq.file), rank: sq.rank};
	});
	return res;
}

function isOutsideBoard(sq) {
	return sq.rank < 1 || sq.rank > 8 || 'A'.compare(sq.file) > 0 || 'H'.compare(sq.file) < 0;
}

function isCastlingIntended(movingPiece, destination, context) {
	return movingPiece.symbol == 'K' && ['G','C'].includes(destination.file) && ((destination.rank == 1 && movingPiece.color == 'W') || (destination.rank == 8 && movingPiece.color == 'B') );
}

function isCastlingLegal(movingPiece,destination,context) {
	// cannot castle if king has already moved
	if(!context.unmovedKingRookList.find(p=>pieceEquals(movingPiece,p))) {
		return false;
	}
	var enemy = movingPiece.color == 'W'?'B':'W';
	var enemyPossibleMoves = getTotalPossibleMoves(enemy, context);

	console.log(enemyPossibleMoves);

	var queenSide = destination.file == 'C';
	// var code = ['C','E','G','H'].reduce((acc,lett)=>{acc[lett]=lett.charCodeAt(0);return acc;},{});
	if(queenSide) {
		// cannot castle queenSide if rook has moved
		if(!context.unmovedKingRookList.find(p=>pieceEquals({symbol:'R',file:'A',rank:movingPiece.rank}))) {
			return false;
		}
		for(var f = 'C'.charCodeAt(0); f <= 'E'.charCodeAt(0); f++) {
			// there is a piece between the king & the rook
			if(f !=  'E'.charCodeAt(0)) {
				if(findPieceAt({rank: movingPiece.rank, file: f}, context.pieceList)) {
					return false;
				}
			}
			return enemyPossibleMoves.every(function(sq) {
				return !(sq.rank == movingPiece.rank && sq.file == String.fromCharCode(f) );
			});
		}
	} else {
		// cannot castle if rook has moved
		if(!context.unmovedKingRookList.find(p=>pieceEquals({symbol:'R',file:'H',rank:movingPiece.rank}))) {
			return false;
		}
		for(var f = 'G'.charCodeAt(0); f >= 'E'.charCodeAt(0); f--) {
			if(f !=  'E'.charCodeAt(0)) {
				if(findPieceAt({rank: movingPiece.rank, file: f}, context.pieceList)) {
					return false;
				}
			}
			return enemyPossibleMoves.every(function(sq) {
				return !(sq.rank == movingPiece.rank && sq.file == String.fromCharCode(f) );
			});
		}
	}
}

function performCastling(movingPiece,destination,context) {
	var queenSide = destination.file == 'C';
	var pieceList = context.pieceList.slice().map((p)=>{
		if(p.symbol == 'R' ) {
			p.file = queenSide?'D':'F';
			return p;
		}
		if(p.symbol == 'K') {
			p.file = queenSide?'C':'G';
		}
		return p;
	});

	return {
		unmovedKingRookList: context.unmovedKingRookList.filter(p=>!pieceEquals(movingPiece)),
		pieceList: pieceList
	};
}


function getKingRange(king, context) {
	var res = [];
	var f = king.file.charCodeAt(0);
	var r = king.rank;
	res.push({file: f , rank: r + 1});
	res.push({file: f + 1,rank: r + 1});
	res.push({file: f + 1, rank:r });
	res.push({file: f + 1, rank:r -1});
	res.push({file: f , rank:r - 1});
	res.push({file: f - 1,rank: r - 1});
	res.push({file: f - 1, rank:r });
	res.push({file: f - 1, rank:r + 1});
	// if(context.)
	res = res.filter((sq,i)=>{

		if( sq.rank >= 1 && sq.rank <= 8 && sq.file >= 'A'.charCodeAt(0) && sq.file <= 'H'.charCodeAt(0)) {
			var p = findPieceAt({ rank: sq.rank, file: String.fromCharCode(sq.file)}, context.pieceList);
			return !p || p.color != king.color;
		} else {
			return false;
		}
	}).map((sq,i)=>{
		return {file: String.fromCharCode(sq.file), rank: sq.rank};
	});
	return res;	
}

function getPawnRange(pawn,context) {
	// straight pawn move
	var res = [];
	if(pawn.color == 'B') {
		if(pawn.rank == 7) {
			res.push({file: pawn.file, rank: pawn.rank - 2});
		}
		res.push({file: pawn.file, rank: pawn.rank - 1});
	} else if(pawn.color == 'W') {
		if(pawn.rank == 2) {
			res.push({file: pawn.file, rank: pawn.rank + 2});
		}
		res.push({file: pawn.file, rank: pawn.rank + 1});
	}
	res = res.filter((sq,i)=>{
		return !findPieceAt(sq, context.pieceList);
	});
	var leftFile = String.fromCharCode(pawn.file.charCodeAt(0) - 1);
	var rightFile = String.fromCharCode(pawn.file.charCodeAt(0) + 1);


	// normal pawn capture
	if(pawn.color == 'W') {
		let leftCaptureSquare = {file: leftFile , rank: pawn.rank +1};
		let rightCaptureSquare = {file: rightFile , rank: pawn.rank +1};
		var leftPiece = findPieceAt(leftCaptureSquare, context.pieceList);
		var rightPiece = findPieceAt(rightCaptureSquare, context.pieceList);
		if(pawn.file != 'A' && leftPiece && leftPiece.color == 'B') {
			res.push(leftCaptureSquare);
		
		} 
		if(pawn.file != 'H' && rightPiece && rightPiece.color == 'B') {
			res.push(rightCaptureSquare);
		}
	}

	if(pawn.color == 'B') {
		let leftCaptureSquare = {file: leftFile , rank: pawn.rank - 1 };
		let rightCaptureSquare = {file: rightFile , rank: pawn.rank - 1 };
		var leftPiece = findPieceAt(leftCaptureSquare, context.pieceList);
		var rightPiece = findPieceAt(rightCaptureSquare, context.pieceList);
		if(pawn.file != 'A' && leftPiece && leftPiece.color == 'W') {
			res.push(leftCaptureSquare);
		} 
		if(pawn.file != 'H' && rightPiece && rightPiece.color == 'W') {
			res.push(rightCaptureSquare);
		}	
	}

	// en-passant
	if(context.justArrivedFourthRankPawn && (pawn.color == 'W' && pawn.rank == 5 || pawn.color == 'B' && pawn.rank == 4)) {
		var enPassantSquares = [];
		console.log(context.justArrivedFourthRankPawn);
		var f = context.justArrivedFourthRankPawn.file.charCodeAt(0);
		if(pawn.file != 'A') {
			enPassantSquares.push({rank: pawn.rank, file: String.fromCharCode(f-1)});
		}
		if(pawn.file != 'H') {
			enPassantSquares.push({rank: pawn.rank, file: String.fromCharCode(f+1)});
		}
		res = res.concat(enPassantSquares);
	}
	return res;
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



function includesSquare(arr, square) {
	// single instruction lambda functions without return
	// should not have curly braces {}
	// ,else it returns undefined.
	return arr.some((sq)=> sq.rank == square.rank && sq.file == square.file );
}

function clonePieceList(pieceList) {
	return pieceList.slice().map((p)=>{
		//return {symbol: p.symbol, color: p.color, rank: p.rank, file: p.file};
		return {...p};
	});
}

function pieceEquals(p1,p2) {
	if(!p1 && !p2) { return true; }
	if(p1 && !p2 || !p1 && p2) { return false; }
	return p1.color == p2.color && p1.symbol == p2.symbol && p1.file == p2.file && p1.rank == p2.rank;
}


/*https://www.jvandemo.com/a-10-minute-primer-to-javascript-modules-module-formats-module-loaders-and-module-bundlers/ */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof module === 'object' && module.exports) {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.returnExports = factory();
	}
}(this, function () {
	//use b in some fashion.

	// Just return a value to define the module export.
	// This example returns an object, but the module
	// can return a function as the exported value.
	return {
		getRookRange: getRookRange,
		getKnightRange: getKnightRange,
		getBishopRange: getBishopRange,
		getQueenRange: getQueenRange,
		getKingRange: getKingRange,
		isLegal: isLegal,
		applyMoveToPieceListSansVerif: applyMoveToPieceListSansVerif,
		applyMoveToContext: applyMoveToContext,
		clonePieceList: clonePieceList,
		makeInitialPieceList: makeInitialPieceList,
		makeInitialUnmovedKingRookList: makeInitialUnmovedKingRookList
	};
}));