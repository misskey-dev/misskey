import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as JSON5 from 'json5';

const keys = [
	'_dark',
	'_light',
	'l-light',
	'l-coffee',
	'l-apricot',
	'l-rainy',
	'l-botanical',
	'l-vivid',
	'l-cherry',
	'l-sushi',
	'l-u0',
	'd-dark',
	'd-persimmon',
	'd-astro',
	'd-future',
	'd-botanical',
	'd-green-lime',
	'd-green-orange',
	'd-cherry',
	'd-ice',
	'd-u0',
]

Promise.all(keys.map((key) => readFile(resolve(__dirname, `../src/themes/${key}.json5`), 'utf8'))).then((sources) => {
	writeFile(
		resolve(__dirname, './themes.ts'),
		`export default ${JSON.stringify(
			Object.fromEntries(sources.map((source, i) => [keys[i], JSON5.parse(source)])),
			undefined,
			2,
		)} as const;`,
		'utf8'
	);
});
