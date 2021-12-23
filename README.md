# chess-react 

A player vs player Chess game using React class components.
Tested using Jest.

To run: Open index.html in your browser

To test: Enter `npm t` in your command line.

## Development choices

Class-based React components have been used along with the React Context API
for state management. Pure functions have been used to check the legality of moves.
This is to help unit-testing.

## Special Moves

- Castling (Kingside & Queenside)
- Pawn Promotion

## Win-Lose

- Checkmate

## Draw 

- Stalemate
- Insufficient material
- 50 move rule
- 5 fold repetition

## Remaining work

- En-passant
- 3 fold repetition
