import { writeFile } from 'node:fs/promises';
import locales from '../../../locales/index.js';

await writeFile(
	new URL('locale.ts', import.meta.url),
	`export default ${JSON.stringify(locales['ja-JP'], undefined, 2)} as const;`,
	'utf8',
)
