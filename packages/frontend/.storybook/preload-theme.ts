import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as JSON5 from 'json5';

Promise.all([
	readFile(resolve(__dirname, '../src/themes/_light.json5'), 'utf8'),
	readFile(resolve(__dirname, '../src/themes/l-light.json5'), 'utf8'),
]).then((sources) => {
	const base = JSON5.parse(sources[0]);
	const theme = JSON5.parse(sources[1]);
	writeFile(
		resolve(__dirname, './theme.ts'),
		`export default ${JSON.stringify(
			Object.assign(theme, {
				base: undefined,
				props: Object.assign(base.props, theme.props),
			}),
			undefined,
			2,
		)} as const;`,
		'utf8'
	);
});
