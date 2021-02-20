var legal =  require('./legal-v2.js');
var jest = require('jest');

function toPiece(str) {
	if(str.length != 4) {
		console.error('argument must have 4 characters: symbol color file rank');
	}
	return {symbol: str.charAt(0), color: str.charAt(1), file:str.charAt(2), rank: +str.charAt(3) }
}

test('clonePieceListTest', ()=>{
	var pl1 =  ['KWE3','KBD7', 'PWD3','PBB7','PBE4','NWA6'].map(toPiece);
	var pl2 = legal.clonePieceList(pl1);
	pl1[0] = toPiece('KWF8');
	expect(pl2[0]).toStrictEqual(toPiece('KWE3'));
	expect(pl1[0]).toStrictEqual(toPiece('KWF8'));
});

test('applyMoveToPieceListSansVerif king', ()=>{
	var c1 =  {pieceList: ['KWE3','KBD7', 'PWD3','PBB7','PBE4','NWA6'].map(toPiece)};
	var pl2 = legal.applyMoveToPieceListSansVerif({symbol:'K',color:'W',rank:3,file:'E'},{rank: 2, file: 'E'},c1);
	expect(pl2).toContainEqual(toPiece('KWE2'));
	expect(pl2).not.toContainEqual(toPiece('KWE3'));
	expect(c1.pieceList).toContainEqual(toPiece('KWE3'));
	expect(c1.pieceList).not.toContainEqual(toPiece('KWE2'));
});

test('applyMoveToPieceListSansVerif pawn', ()=>{
	var c1 =  {pieceList: legal.makeInitialPieceList()};
	var pl2 = legal.applyMoveToPieceListSansVerif({symbol:'P',color:'W',rank:2,file:'E'},{rank: 3, file: 'E'},c1);
	expect(c1.pieceList).toContainEqual(toPiece('PWE2'));
	expect(c1.pieceList).not.toContainEqual(toPiece('PWE3'));
	expect(pl2).not.toContainEqual(toPiece('PWE2'));
	expect(pl2).toContainEqual(toPiece('PWE3'));
})

test('applyMoveToPieceListSansVerif pawn 3', ()=>{
	var c1 =  {pieceList: legal.makeInitialPieceList()};
	var pl2 = legal.applyMoveToPieceListSansVerif({symbol:'P',color:'W',rank:2,file:'D'},{rank: 3, file: 'D'},{pieceList:c1.pieceList});
	//var pl2 = legal.applyMoveToPieceListSansVerif({symbol:'P',color:'B',rank:7,file:'A'},{rank: 5, file: 'A'},{pieceList:c1.pieceList});
	expect(c1.pieceList).toContainEqual(toPiece('PBA7'));
	expect(c1.pieceList).not.toContainEqual(toPiece('PBA5'));
	expect(pl2).not.toContainEqual(toPiece('PBA5'));
	expect(pl2).toContainEqual(toPiece('PWD3'));
	expect(pl2).not.toContainEqual(toPiece('PWD2'));
})

test('white pawn promotion to queen', ()=> {
	var c1 = {pieceList: ['KWE4','KBD7','PWA7'].map(toPiece) , promotionSymbol:'Q'};
	var c2 = legal.applyMoveToContext(c1.pieceList[2], {rank:8,file:'A'}, c1);
	expect(c2.pieceList).toContainEqual(toPiece('QWA8'));
	// expect(legal.performCastling).not.toHaveBeenCalled();
});

test('pawn promotion does not result in discovered attack on own king', ()=> {
	var c1 = {pieceList: ['KBF4','RBB7','KWG7','PWD7'].map(toPiece) , promotionSymbol:'Q'};
	var c2 = legal.applyMoveToContext(c1.pieceList[3], {rank:8,file:'D'}, c1);
	expect(legal.isLegal(c1.pieceList[3], {rank: 8, file:'D'}, c1 )).toBeFalsy()
	expect(c2).not.toHaveProperty('pieceList');
});

test('applyMoveToContext updates unmovedKingRookList', ()=>{
	var c1 = {pieceList: ['KWE1','RWA1','RWH1','NWE2','KBE8','QBD7','RBH8'].map(toPiece), unmovedKingRookList:['']};
	var c2 = legal.applyMoveToContext(c1.pieceList[2], { rank: 1, file:'F'}, c1);
	expect(c2.unmovedKingRookList).not.toContainEqual(toPiece('RWH1'));
});


test('isCastlingIntended ',()=>{
	var c1 = {pieceList: ['KWE1','RWA2','KBE8','RBH8'].map(toPiece), unmovedKingRookList: legal.makeInitialUnmovedKingRookList()};
	expect(legal.isCastlingIntended(c1.pieceList[0], {file:'C',rank:1}, c1)).toBeTruthy()
});

test('moved king cannot castle', ()=>{
	var c1 = {pieceList: ['KWE1','RWA2','KBE8','RBH8'].map(toPiece), unmovedKingRookList: legal.makeInitialUnmovedKingRookList().filter((p)=>p.symbol=='K'&&p.color=='B')};
	expect(legal.isCastlingLegal(c1.pieceList[2],{file:'G',rank:8}, c1)).toBeFalsy();
});

test('moved rook cannot castle', ()=>{
	var c1 = {pieceList: ['KWE1','RWA2','KBE8','RBH8'].map(toPiece), unmovedKingRookList: legal.makeInitialUnmovedKingRookList().filter((p)=>p.symbol=='R'&&p.color=='B')};
	expect(legal.isCastlingLegal(c1.pieceList[0],{file:'G',rank:8}, c1)).toBeFalsy();
});

test('king cannot castle without rook', ()=>{
	var c1 = {pieceList: ['KWE1','RWA2','KBE8','RBH8'].map(toPiece), unmovedKingRookList: legal.makeInitialUnmovedKingRookList()};
	expect(legal.isCastlingLegal(c1.pieceList[0],{file:'C',rank:1}, c1)).toBeFalsy();
});

test('king cannot castle with piece in between', ()=>{
	var c1 = {pieceList: ['KWE1','RWA2','KBE8','BBG8','RBH8'].map(toPiece), unmovedKingRookList: legal.makeInitialUnmovedKingRookList()};
	expect(legal.isCastlingLegal(c1.pieceList[2],{file:'G',rank:8}, c1)).toBeFalsy();
});



test('king cannot castle under check', ()=>{
	var c1 = {pieceList: ['KWE1','RWA2','RWH1','KBE8','BBG8','RBH8','QBE7'].map(toPiece), unmovedKingRookList: legal.makeInitialUnmovedKingRookList()};
	expect(legal.isCastlingLegal(c1.pieceList[0],{file:'C',rank:1}, c1)).toBeFalsy();
});


test('king cannot castle with intermediary square under enemy influence', ()=>{
	var c1 = {pieceList: ['KWE1','RWA1','RWH1','KBE8','BBG8','RBH8','NBB3'].map(toPiece), unmovedKingRookList: legal.makeInitialUnmovedKingRookList()};
	expect(legal.isCastlingLegal(c1.pieceList[0],{file:'C',rank:1}, c1)).toBeFalsy();
});


test('preverify if king castle king side', ()=>{
	var c1 = {pieceList: ['KWE1','RWA1','RWH1','KBE8','BBG8','RBH8'].map(toPiece), unmovedKingRookList: legal.makeInitialUnmovedKingRookList()};
	expect(c1.unmovedKingRookList).toContainEqual({symbol:'R', rank:1, file:'H', color:'W'});
	expect(legal.isCastlingLegal(c1.pieceList[0],{file:'G',rank:1}, c1)).toBeTruthy();
});

test('queenside castle', ()=>{
	var c1 = {pieceList: ['KWE1','RWA1','RWH1','KBE8','RBA8','BBG8','RBH8'].map(toPiece), unmovedKingRookList: legal.makeInitialUnmovedKingRookList()};
	var c2 = legal.performCastling(c1.pieceList[3], {file:'C',rank:8}, c1);
	expect(c2.pieceList).toContainEqual(toPiece('KBC8'));
	expect(c2.pieceList).toContainEqual(toPiece('RBD8'));
	expect(c2.unmovedKingRookList).not.toContainEqual(toPiece('KBE8'));
})

test('only 1 king can castle at a time kingside', ()=>{
	var c1 = {pieceList: ['KWE1','RWA1','RWH1','KBE8','BBG8','RBH8'].map(toPiece), unmovedKingRookList: legal.makeInitialUnmovedKingRookList()};
	var c2 = legal.performCastling(c1.pieceList[0],{file:'G',rank:1},c1);
	expect(c2.unmovedKingRookList).not.toContainEqual({symbol:'K',color:'W'});
	expect(c2.pieceList).toContainEqual(toPiece('KWG1'));
	expect(c2.pieceList).toContainEqual(toPiece('RWF1'));
	expect(c2.unmovedKingRookList.length).toBe(4);
});
