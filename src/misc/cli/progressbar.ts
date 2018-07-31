import { EventEmitter } from 'events';
import * as readline from 'readline';
import chalk from 'chalk';

/**
 * Progress bar
 */
export default class extends EventEmitter {
	public max: number;
	public value: number;
	public text: string;
	private indicator: number;

	constructor(max: number, text: string = null) {
		super();
		this.max = max;
		this.value = 0;
		this.text = text;
		this.indicator = 0;
		this.draw();

		const iclock = setInterval(() => {
			this.indicator = (this.indicator + 1) % 4;
			this.draw();
		}, 200);

		this.on('complete', () => {
			clearInterval(iclock);
		});
	}

	public increment(): void {
		this.value++;
		this.draw();

		// Check if it is fulfilled
		if (this.value === this.max) {
			this.indicator = null;

			cll();
			process.stdout.write(`${this.render()} -> ${chalk.bold('Complete')}\n`);

			this.emit('complete');
		}
	}

	public draw(): void {
		const str = this.render();
		cll();
		process.stdout.write(str);
	}

	private render(): string {
		const width = 30;
		const t = this.text ? `${this.text} ` : '';

		const v = Math.floor((this.value / this.max) * width);
		const vs = new Array(v + 1).join('*');

		const p = width - v;
		const ps = new Array(p + 1).join(' ');

		const percentage = Math.floor((this.value / this.max) * 100);
		const percentages = chalk.gray(`(${percentage} %)`);

		let i: string;
		switch (this.indicator) {
			case 0: i = '-'; break;
			case 1: i = '\\'; break;
			case 2: i = '|'; break;
			case 3: i = '/'; break;
			case null: i = '+'; break;
		}

		return `${i} ${t}[${vs}${ps}] ${this.value} / ${this.max} ${percentages}`;
	}
}

/**
 * Clear current line
 */
function cll(): void {
	readline.clearLine(process.stdout, 0); // Clear current text
	readline.cursorTo(process.stdout, 0, null); // Move cursor to the head of line
}
