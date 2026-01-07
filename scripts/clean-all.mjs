/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';

const __dirname = import.meta.dirname;

(async () => {
	fs.rmSync(__dirname + '/../packages/backend/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/backend/src-js', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/backend/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/frontend-shared/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/frontend-shared/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/frontend-builder/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/frontend/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/frontend/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/frontend-embed/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/frontend-embed/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/sw/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/sw/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/i18n/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/i18n/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/misskey-js/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/misskey-js/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/misskey-reversi/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/misskey-reversi/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/misskey-bubble-game/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/misskey-bubble-game/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../node_modules', { recursive: true, force: true });

	execSync('pnpm store prune', {
		cwd: __dirname + '/../',
		stdio: 'inherit',
	});
})();
