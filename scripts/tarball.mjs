import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'fast-glob';
import Pack from 'tar/lib/pack.js';
import meta from '../package.json' assert { type: "json" };

const cwd = fileURLToPath(new URL('..', import.meta.url));
const mkdirPromise = mkdir(resolve(cwd, 'built', 'tarball'), { recursive: true });
const patterns = [
	'{assets,fluent-emojis,locales,misskey-assets}/**/*',
	'packages/.config/example.yml',
	'packages/{backend,frontend,misskey-bubble-game,misskey-js,misskey-js/generator,misskey-reversi,sw}/{src/**/*,.swcrc,*}',
	'packages/backend/{assets,migration,nsfw-model}/**/*',
	'packages/frontend/{.storybook,@types,assets,lib,public}/**/*',
	'!packages/frontend/.storybook/{locale.ts,themes.ts,*.js}',
	'!packages/misskey-js/CONTRIBUTING.md',
	'packages/meta.json',
	'scripts/{changelog-checker/{src/**/*,*},*}',
	'.node-version',
	'.npmrc',
	'CHANGELOD.md',
	'COPYING',
	'LICENSE',
	'README.md',
	'SECURITY.md',
	'package.json',
	'pnpm-lock.yaml',
	'pnpm-workspace.yaml',
];
const pack = new Pack({ cwd, gzip: true });

for await (const entry of glob.stream(patterns)) {
	pack.add(entry);
}

pack.end();

await mkdirPromise;

pack.pipe(createWriteStream(resolve(cwd, 'built', 'tarball', `misskey-${meta.version}.tar.gz`)));
