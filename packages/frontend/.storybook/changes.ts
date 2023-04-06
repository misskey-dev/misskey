import fs from 'node:fs/promises';
import path from 'node:path';
import micromatch from 'micromatch';
import main from './main';

fs.readFile(
	path.resolve(__dirname, '../storybook-static/preview-stats.json')
).then((buffer) => {
	const stats = JSON.parse(buffer.toString());
	const modules = new Set(
		process.argv
			.slice(2)
			.map((arg) =>
				path.relative(
					path.resolve(__dirname, '..'),
					path.resolve(__dirname, '../../..', arg)
				)
			)
	);
	if (
		micromatch(Array.from(modules), [
			'../../assets/**',
			'../../fluent-emojis/**',
			'../../locales/**',
			'../../misskey-assets/**',
			'assets/**',
			'public/**',
			'../../pnpm-lock.yaml',
		]).length
	) {
		return;
	}
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
	const stories = micromatch(
		Array.from(modules),
		main.stories.map((story) => path.resolve(__dirname, story))
	);
	for (const story of stories) {
		process.stdout.write(` --only-story-files ${story}`);
	}
});
