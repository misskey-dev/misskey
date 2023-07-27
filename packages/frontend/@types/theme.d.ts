/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module '@/themes/*.json5' {
	import { Theme } from '@/scripts/theme';

	const theme: Theme;

	export default theme;
}
