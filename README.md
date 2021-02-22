# chess-react 

A player vs player Chess game using React class components.
Testing using Jest.

To run: Open index.html in your browser

To test: Enter `npm t` in your command line.

## Development choices

Class-based React components have been used along with the React Context API
for state management. Pure functions have been used to check the legality of moves.
This is to help unit-testing.

## Remaining work

- En-passant
- Draw conditions
	- Stalemate
	- 3 move repetition
	- 50 move rule
