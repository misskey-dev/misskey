/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Theme } from '@/js/theme.mjs';

export { };

declare module 'frontend-shared/themes/*.json5' {

	const theme: Theme;

	export default theme;
}
