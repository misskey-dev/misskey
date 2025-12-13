/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module '@@/themes/*.json5' {
	import { Theme } from '@/theme.js';

	const theme: Theme;

	// biome-ignore lint/style/noDefaultExport: json is so
	export default theme;
}
