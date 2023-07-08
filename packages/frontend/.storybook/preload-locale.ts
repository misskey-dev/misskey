import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as locales from '../../../locales';

writeFile(
	resolve(__dirname, 'locale.ts'),
	`export default ${JSON.stringify(locales['ja-JP'], undefined, 2)} as const;`,
	'utf8',
)
