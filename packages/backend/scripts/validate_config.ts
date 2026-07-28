/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { loadConfig } from '../src/config.js';

try {
	loadConfig({ forceConfigValidation: true });
	console.log('Configuration is valid ✓');
} catch (error) {
	console.error(error instanceof Error ? error.message : 'Configuration validation failed');
	process.exitCode = 1;
}
