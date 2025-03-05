/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Theme } from '@/scripts/theme.js';
import { getBuiltinThemes } from '@/scripts/theme.js';
import { miLocalStorage } from '@/local-storage.js';
import { $i } from '@/account.js';

export function getThemes(): Theme[] {
	if ($i == null) return [];
	return JSON.parse(miLocalStorage.getItem('themes') ?? '[]');
}

export async function addTheme(theme: Theme): Promise<void> {
	if ($i == null) return;
	const builtinThemes = await getBuiltinThemes();
	if (builtinThemes.some(t => t.id === theme.id)) {
		throw new Error('builtin theme');
	}
	const themes = getThemes();
	if (themes.some(t => t.id === theme.id)) {
		throw new Error('already exists');
	}
	themes.push(theme);
	miLocalStorage.setItem('themes', JSON.stringify(themes));
}

export async function removeTheme(theme: Theme): Promise<void> {
	if ($i == null) return;
	const themes = getThemes().filter(t => t.id !== theme.id);
	miLocalStorage.setItem('themes', JSON.stringify(themes));
}
