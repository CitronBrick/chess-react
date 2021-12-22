# chess-react 

A player vs player Chess game using React class components.
Tested using Jest.

To run: Open index.html in your browser

To test: Enter `npm t` in your command line.

## Development choices

Class-based React components have been used along with the React Context API
for state management. Pure functions have been used to check the legality of moves.
This is to help unit-testing.

## Remaining work

- En-passant
- Draw conditions
	- 3 fold repetition
	- 5 fold repetition
