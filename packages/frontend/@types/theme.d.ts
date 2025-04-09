/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module '@@/themes/*.json5' {
	import { Theme } from '@/theme.js';

	const theme: Theme;

	export default theme;
}
