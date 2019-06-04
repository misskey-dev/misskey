require('json5/lib/register');
import * as fs from 'fs';
import { Theme } from '../../theme';

export function onActivate(service: any) {
	const fileNames = fs.readdirSync(`${__dirname}/themes`)
		.filter(f => fs.statSync(`${__dirname}/themes/${f}`).isFile());

	for (const fileName of fileNames) {
		const theme = require(`${__dirname}/themes/${fileName}`) as Theme;
		service.registerTheme(theme);
	}
}
