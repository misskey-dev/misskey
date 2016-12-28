import * as readline from 'readline';

/**
 * Indicator
 */
export default class {
	private clock: NodeJS.Timer;

	constructor(text: string) {
		let i = 0; // Dots counter

		draw();
		this.clock = setInterval(draw, 300);

		function draw(): void {
			cll();
			i = (i + 1) % 4;
			const dots = new Array(i + 1).join('.');
			process.stdout.write(text + dots); // Write text
		}
	}

	public end(): void {
		clearInterval(this.clock);
		cll();
	}
}

/**
 * Clear current line
 */
function cll(): void {
	readline.clearLine(process.stdout, 0); // Clear current text
	readline.cursorTo(process.stdout, 0, null); // Move cursor to the head of line
}
