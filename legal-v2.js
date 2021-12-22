function findPieceAt(sq, pieceList) {
	return pieceList.find((piece,i)=> {
		return piece.rank == sq.rank && piece.file == sq.file;
	});
}

function toPiece(str) {
	if(str.length != 4) {
		console.error('argument must have 4 characters: symbol color file rank');
	}
	return {symbol: str.charAt(0), color: str.charAt(1), file:str.charAt(2), rank: +str.charAt(3) }
}

function makeInitialUnmovedKingRookList() {
	var res = ['KWE1','RWA1','RWH1'].flatMap((s,i)=> {
		var p1 = toPiece(s);
		var p2 = {...p1};
		p2.color =  'B';
		p2.rank = 8;
		return [p1,p2];
	});
	return res;
}


function isLegal(movingPiece, destination, context) {
	var range = getPieceRange(movingPiece, context);
	var possible = range.some((sq)=>{return sq.rank == destination.rank && sq.file == destination.file});

	

	if(possible) {


		// remove captured piece
		var updatedPieceList = context.pieceList.filter((piece,i)=> {
			var captured = (piece.symbol != 'K' && piece.rank == destination.rank && piece.file == destination.file);
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


function noteScoreSheetEntry(movingPiece, destination, context) {
	console.log(movingPiece);
	console.log(destination);
	if(isCastlingIntended(movingPiece,destination,context)) {
		console.log('isCastlingIntended');
		if(destination.file == 'G') {
			return 'O-O';
		} else if(destination.file == 'C') {
			return 'O-O-O';
		} else {
			console.error('impossible error case. trying to note illegal castling');
		}
		return;
	}

	let res =  (movingPiece.symbol=='P'?'':movingPiece.symbol);
	res += movingPiece.file.toLowerCase()+movingPiece.rank;
	res += '-' +destination.file.toLowerCase() + destination.rank;
	if(isPromotion(movingPiece,destination)) {
		res+= `= ${context.promotionSymbol}`;
	}

	return res;
}

function suffixScoreSheetEntry(scoreSheet, symbol) {
	var last = scoreSheet.pop();
	last += symbol;
	return scoreSheet.concat(last);
}



function applyMoveToContext(movingPiece, destination, context) {
	var range = getPieceRange(movingPiece, context);

	if(isCastlingIntended(movingPiece,destination,context) && isCastlingLegal(movingPiece,destination,context)) {
		var res = performCastling(movingPiece,destination,context);
		res.turn = context.turn == 'W'?'B':'W';
		res.scoreSheet = context.scoreSheet.concat(noteScoreSheetEntry(movingPiece,destination,context));
		return res;
	}

	var possible = range.some((sq)=>{return sq.rank == destination.rank && sq.file == destination.file});
	if(possible) {

		var updatedPieceList = applyMoveToPieceListSansVerif(movingPiece, destination, context);



		var justArrivedFourthRankPawnList  = context.justArrivedFourthRankPawnList || []; 
		if(movingPiece.symbol == 'P' && ((movingPiece.color == 'W' && destination.rank == 5) || (movingPiece.color == 'B' && destination.rank == 4) )) {
			justArrivedFourthRankPawnList = [movingPiece].concat(justArrivedFourthRankPawnList);
		}

		// var updatedContext = {pieceList: updatedPieceList, justArrivedFourthRankPawnList , unmovedKingRookList: context.unmovedKingRookList};
		var updatedContext = { ...context,pieceList: updatedPieceList, justArrivedFourthRankPawnList};

		if(updatedContext.pieceList.length != context.pieceList.length || movingPiece.symbol == 'P') {
			updatedContext.movesSincePushCapture = 0;
		} else {
			updatedContext.movesSincePushCapture+=0.5;
		}



		// pawn promotion
		var promotion = isPromotion(movingPiece,destination);
		if(promotion) {
			updatedContext.pieceList = updatedContext.pieceList.map((p)=>{
				if(p.symbol == 'P' && (p.rank == 8 || p.rank == 1 )) {
					p.symbol = context.promotionSymbol;
					return p; 
				}
				return p
			});
		}

		// update unmovedKingRookList when king or rook has moved
		if(['K','R'].includes(movingPiece.symbol)) {
			updatedContext.unmovedKingRookList = context.unmovedKingRookList.filter((p)=>{
				return !pieceEquals(movingPiece,p);
			});
		} 


		// remove rook from unmovedKingRookList when it has been captured
		if(context.unmovedKingRookList) {
			updatedContext.unmovedKingRookList = context.unmovedKingRookList.filter((kr,i)=> {
				return updatedContext.pieceList.find((p)=>pieceEquals(p,kr));
			});
		}



		if(isColorUnderCheck(movingPiece.color, updatedContext )) {
			console.log('check in new square');
			return {};
		} else {
			updatedContext.turn = context.turn == 'W'?'B':'W';
			if(context.turn == 'W') {
				++updatedContext.moveNo;
			}

			if(updatedContext.justArrivedFourthRankPawnList.length >= 1) {
				// updatedContext.justArrivedFourthRankPawnList
			}

			// update scoresheet
			updatedContext.scoreSheet = (context.scoreSheet || []).concat(noteScoreSheetEntry(movingPiece, destination, context));


			updatedContext.positionList = context.positionList.concat({pieceList: clonePieceList(updatedContext.pieceList), unmovedKingRookList:updatedContext.unmovedKingRookList  });
			console.log(updatedContext.positionList.length, context.positionList.length);


			var enemy = movingPiece.color == 'W'?'B':'W';
			var enemyPossibleMoves = getTotalPossibleMoves(enemy, updatedContext);
			


			// no problem

			// pb is every not applyMoveToPieceListSansVerif
			var enemyHasNoMoveLeft =  enemyPossibleMoves.every((pm)=>{
				var overUpdatedContext = {pieceList: applyMoveToPieceListSansVerif(pm.piece, {rank: pm.rank, file: pm.file}, {pieceList: clonePieceList(updatedContext.pieceList)}) };
				return isColorUnderCheck(enemy, overUpdatedContext);
			});

			if(isColorUnderCheck(enemy, updatedContext)) { // enemy under check
				console.log(updatedContext.scoreSheet);
				updatedContext.scoreSheet = suffixScoreSheetEntry(updatedContext.scoreSheet,'+');
				if(enemyHasNoMoveLeft) {   // checkmate for enemy
					window.alert('checkmate for ' + enemy);
					updatedContext.scoreSheet = suffixScoreSheetEntry(updatedContext.scoreSheet,'+');
					updatedContext.result = {code: movingPiece.color == 'W'? '1-0':'0-1', message: movingPiece.color + ' has won by checkmate'};

				}
			} else if(enemyHasNoMoveLeft) {
				window.alert('game drawn by stalemate');
				updatedContext.result = {code: '0.5-0.5',message:'game drawn by stalemate'};
			} else if(hasInsufficientMaterial(updatedContext)) { 
				window.alert('game drawn due to insufficient material');
				updatedContext.result = {code:'0.5-0.5',message:'game drawn due to insufficient material'};
			} else if(updatedContext.movesSincePushCapture >= 50) {
				window.alert('game drawn due to 50 move rule');
				updatedContext.result = {code:'0.5-0.5', message: 'game drawn as there was neither any capture nor a pawn move  in the last 50 moves'};
			} else if(updatedContext.positionList.filter(position=>positionEquals(position,updatedContext.positionList[updatedContext.positionList.length-1])).length >= 5) {
				window.alert('game drawn due to 5 fold repetition');
				updatedContext.result = {code: '0.5-0.5', message: 'game drawn due to 5 fold repetition'};

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

	// console.log(enemyPossibleMoves);

	var queenSide = destination.file == 'C';
	var rookFile = queenSide?'A':'H';
	// var code = ['C','E','G','H'].reduce((acc,lett)=>{acc[lett]=lett.charCodeAt(0);return acc;},{});

	var rook = {symbol:'R', color: movingPiece.color, file:rookFile,rank:movingPiece.rank};

	// cannot castle if rook has moved
	if(!context.unmovedKingRookList.find(p=>pieceEquals(p,rook))) {
		return false;
	}

	// cannot castle if rook does not exist
	if(!context.pieceList.find(p=>pieceEquals(p,rook))) {
		return false;
	}

	if(queenSide) {
		
		for(var f = 'C'.charCodeAt(0); f <= 'E'.charCodeAt(0); f++) {
			// there is a piece between the king & the rook
			if(f !=  'E'.charCodeAt(0)) {
				if(findPieceAt({rank: movingPiece.rank, file: String.fromCharCode(f)}, context.pieceList)) {
					return false;
				}
			}
			if(!enemyPossibleMoves.every((sq)=> !(sq.rank == movingPiece.rank && sq.file == String.fromCharCode(f) ))) {
				return false;
			}
		}
		return true;
	} else {
		
		for(var f = 'G'.charCodeAt(0); f >= 'E'.charCodeAt(0); f--) {
			if(f !=  'E'.charCodeAt(0)) {
				// console.log('piece blocker');
				if(findPieceAt({rank: movingPiece.rank, file: String.fromCharCode(f)}, context.pieceList)) {
					return false;
				}
			}
			if(!enemyPossibleMoves.every((sq)=> !(sq.rank == movingPiece.rank && sq.file == String.fromCharCode(f) ))) {
				return false;
			}
		}
		return true;
	}
}

function performCastling(movingPiece,destination,context) {
	var queenSide = destination.file == 'C';
	var rook = {symbol: 'R', color : movingPiece.color, rank : movingPiece.rank, file : (queenSide?'A':'H') };
	var unmovedKingRookList = context.unmovedKingRookList.filter(p=>(!pieceEquals(movingPiece,p) && !pieceEquals(p,rook)  )); 

	// when movingPiece passed as context.pieceList[x], this map updates movingPiece itself
	var pieceList = context.pieceList.slice().map((p)=>{
		if(pieceEquals(rook,p) ) {
			p.file = queenSide?'D':'F';
		} else if(pieceEquals(movingPiece,p)) {
			p.file = queenSide?'C':'G';
		}
		return p;
	});


	return {
		unmovedKingRookList: unmovedKingRookList,
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
	if(context.justArrivedFifthRankPawn && (pawn.color == 'W' && pawn.rank == 5 || pawn.color == 'B' && pawn.rank == 4)) {
		var enPassantSquares = [];
		var f = context.justArrivedFifthRankPawn.file.charCodeAt(0);
		if(pawn.file != 'A') {
			enPassantSquares.push({rank: pawn.rank, file: String.fromCharCode(f-1)});
		}
		if(pawn.file != 'H') {
			enPassantSquares.push({rank: pawn.rank, file: String.fromCharCode(f+1)});
		}
		if(enPassantSquares.length) {
			// console.log(enPassantSquares);
		}
		res = res.concat(enPassantSquares);
	}
	return res;
}

function isPromotion(movingPiece,destination) {
	return movingPiece.symbol == 'P' && (destination.rank == 8 && movingPiece.color == 'W' || destination.rank == 1 && movingPiece.color == 'B');
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


/* deep colone the pieceList array */
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

function pieceListEquals(p1,p2) {
	return p1.every((piece,i)=> pieceEquals(piece, p2[i]));
}

function positionEquals(p1,p2) {
	return pieceListEquals(p1.pieceList, p2.pieceList) && pieceListEquals(p1.unmovedKingRookList, p2.unmovedKingRookList);
}


/*https://www.jvandemo.com/a-10-minute-primer-to-javascript-modules-module-formats-module-loaders-and-module-bundlers/ */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['end.js'], factory);
	} else if (typeof module === 'object' && module.exports) {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('./end.js'));
	} else {
		// Browser globals (root is window)
		var end = {hasInsufficientMaterial};
		root.returnExports = factory(end);
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
		positionEquals: positionEquals,
		makeInitialPieceList: makeInitialPieceList,
		makeInitialUnmovedKingRookList: makeInitialUnmovedKingRookList,
		isCastlingIntended: isCastlingIntended,
		isCastlingLegal: isCastlingLegal,
		performCastling: performCastling
	};
}));



function hasInsufficientMaterial(context) {
	var bishops = {'W':new Set(),'B':new Set()};
	var knights = {W: [], B: []};
	for(var i = 0 ; i < context.pieceList.length; i++) {
		var p = context.pieceList[i];
		// sufficient material if : Q, R, P present
		if(['Q','R','P'].includes(p.symbol)) {
			return false;
		} else if(p.symbol == 'B') {
			var squareColor = p.rank%2 == ((p.file.charCodeAt(0) - 65)%2);
			bishops[p.color].add(squareColor);
		} else if(p.symbol == 'N') {
			knights[p.color].push(p);
		}
	}
	// sufficient material if 2 different squareColor B are presetn
	if( bishops.W.size >= 2 || bishops.B.size >= 2) {
		return false;
	}
	// sufficient material if a B & N are present in same camp
	var bishopAndKnight = (bishops.W.size && knights.W.length) || (bishops.B.size && knights.B.length );
	return !bishopAndKnight;
}