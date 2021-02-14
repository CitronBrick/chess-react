var legal =  require('./legal-v2.js');


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

});