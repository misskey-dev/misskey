/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { promises as fsp } from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

export default function pluginCopyLocales(): Plugin {
	return {
		name: 'copy-locales',
		async buildEnd() {
			const outDir = this.environment.config.build.outDir;
			const localesDir = path.resolve(__dirname, '../../../built/_frontend_dist_/locales');
			await fsp.mkdir(path.join(outDir, 'assets/locales'), { recursive: true });
			await fsp.cp(localesDir, path.join(outDir, 'assets/locales'), { recursive: true });
		},
	};
}
