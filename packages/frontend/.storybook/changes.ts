import fs from 'node:fs/promises';
import path from 'node:path';

fs.readFile(path.resolve(__dirname, '../storybook-static/preview-stats.json'))
	.then((buffer) => {
		const stats = JSON.parse(buffer.toString());
		const modules = new Set(process.argv.slice(2).map((arg) => path.resolve(__dirname, '..', arg)));
		for (;;) {
			const oldSize = modules.size;
			for (const module of Array.from(modules)) {
				if (stats.modules[module]) {
					for (const reason of stats.modules[module].reasons) {
						modules.add(reason.moduleName);
					}
				}
			}
			if (modules.size === oldSize) {
				break;
			}
		}
		for (const file of Array.from(modules)) {
			process.stdout.write(`--only-story-files ${file}`);
		}
	})
