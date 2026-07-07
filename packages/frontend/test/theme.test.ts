/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, assert, beforeEach, describe, test, vi } from 'vitest';
import type { Theme } from '@@/js/theme.js';
import lightTheme from '@@/themes/_light.json5';
import darkTheme from '@@/themes/_dark.json5';
import './init';

vi.mock('@/i18n.js', () => ({
	i18n: {
		ts: {
			_theme: {
				alreadyInstalled: 'already installed',
				invalid: 'invalid',
			},
		},
	},
	updateI18n: vi.fn(),
}));

vi.mock('@/os.js', () => ({
	alert: vi.fn(),
}));

const cloneTheme = <T>(value: T): T => structuredClone(value);

const createTheme = (base: 'light' | 'dark', options: {
	id: string;
	name: string;
	accent: string;
	bg: string;
	fg: string;
}): Theme => {
	const builtin = base === 'dark' ? darkTheme : lightTheme;

	return {
		id: options.id,
		name: options.name,
		author: 'tester',
		base,
		props: {
			...cloneTheme(builtin.props),
			accent: options.accent,
			bg: options.bg,
			fg: options.fg,
		},
	};
};

const primaryTheme = createTheme('light', {
	id: 'primary-theme',
	name: 'Primary Theme',
	accent: '#224488',
	bg: '#faf7f2',
	fg: '#1a1a1a',
});

const previewTheme = createTheme('dark', {
	id: 'preview-theme',
	name: 'Preview Theme',
	accent: '#55aa33',
	bg: '#101820',
	fg: '#f4f4f4',
});

const replacementTheme = createTheme('dark', {
	id: 'replacement-theme',
	name: 'Replacement Theme',
	accent: '#bb5500',
	bg: '#18110f',
	fg: '#f6e7df',
});

const loadThemeModule = async () => {
	vi.resetModules();
	return await import('@/theme.js');
};

const resetDocument = () => {
	window.localStorage.clear();
	document.head.innerHTML = '<meta name="theme-color" content="#000000">';
	document.documentElement.className = '';
	document.documentElement.removeAttribute('data-color-scheme');
	document.documentElement.style.cssText = '';
	Reflect.deleteProperty(document, 'startViewTransition');
	Object.defineProperty(document, 'visibilityState', {
		configurable: true,
		value: 'visible',
	});
};

describe('ThemeManager', () => {
	beforeEach(() => {
		resetDocument();
	});

	afterEach(() => {
		window.localStorage.clear();
	});

	test('通常テーマ適用後のプレビューは現在テーマのみを切り替え、キャッシュは保持する', async () => {
		const { themeManager, isPreviewMode } = await loadThemeModule();

		themeManager.updateTheme(primaryTheme);
		const cachedTheme = window.localStorage.getItem('theme');
		const cachedThemeId = window.localStorage.getItem('themeId');

		themeManager.previewTheme(previewTheme);

		assert.strictEqual(themeManager.theme?.id, primaryTheme.id);
		assert.strictEqual(themeManager.currentTheme?.id, previewTheme.id);
		assert.strictEqual(themeManager.currentThemeId, previewTheme.id);
		assert.strictEqual(themeManager.isPreviewMode, true);
		assert.strictEqual(isPreviewMode.value, true);
		assert.strictEqual(document.documentElement.dataset.colorScheme, 'dark');
		assert.strictEqual(document.documentElement.style.getPropertyValue('--MI_THEME-accent'), themeManager.currentCompiledTheme?.accent);
		assert.strictEqual(window.localStorage.getItem('theme'), cachedTheme);
		assert.strictEqual(window.localStorage.getItem('themeId'), cachedThemeId);
	});

	test('プレビュー解除で元のテーマと DOM 状態が復元される', async () => {
		const { themeManager, isPreviewMode } = await loadThemeModule();

		themeManager.updateTheme(primaryTheme);
		const originalCompiledThemeColor = themeManager.currentCompiledTheme?.htmlThemeColor;

		themeManager.previewTheme(previewTheme);
		const previewCompiledThemeColor = themeManager.currentCompiledTheme?.htmlThemeColor;
		assert.strictEqual(themeManager.currentTheme?.id, previewTheme.id);
		assert.notStrictEqual(previewCompiledThemeColor, originalCompiledThemeColor);

		themeManager.clearPreview();

		assert.strictEqual(themeManager.theme?.id, primaryTheme.id);
		assert.strictEqual(themeManager.currentTheme?.id, primaryTheme.id);
		assert.strictEqual(themeManager.currentCompiledTheme?.htmlThemeColor, originalCompiledThemeColor);
		assert.strictEqual(themeManager.isPreviewMode, false);
		assert.strictEqual(isPreviewMode.value, false);
		assert.strictEqual(document.documentElement.dataset.colorScheme, 'light');
		assert.strictEqual(document.documentElement.style.getPropertyValue('--MI_THEME-accent'), themeManager.currentCompiledTheme?.accent);
		assert.strictEqual(document.head.querySelector('meta[name="theme-color"]')?.getAttribute('content'), originalCompiledThemeColor);
		assert.strictEqual(window.localStorage.getItem('themeId'), primaryTheme.id);
	});

	test('プレビュー中に通常テーマを更新するとプレビューを抜けて新しい通常テーマが適用される', async () => {
		const { themeManager, isPreviewMode } = await loadThemeModule();

		themeManager.updateTheme(primaryTheme);
		themeManager.previewTheme(previewTheme);
		themeManager.updateTheme(replacementTheme);

		assert.strictEqual(themeManager.theme?.id, replacementTheme.id);
		assert.strictEqual(themeManager.currentTheme?.id, replacementTheme.id);
		assert.strictEqual(themeManager.isPreviewMode, false);
		assert.strictEqual(isPreviewMode.value, false);
		assert.strictEqual(document.documentElement.dataset.colorScheme, 'dark');
		assert.strictEqual(document.documentElement.style.getPropertyValue('--MI_THEME-accent'), themeManager.currentCompiledTheme?.accent);
		assert.strictEqual(window.localStorage.getItem('themeId'), replacementTheme.id);
	});

	test('themeChanging と themeChanged はプレビュー適用と復帰のたびに発火する', async () => {
		const { themeManager } = await loadThemeModule();
		const events: string[] = [];

		themeManager.on('themeChanging', () => {
			events.push('themeChanging');
		});
		themeManager.on('themeChanged', () => {
			events.push('themeChanged');
		});

		themeManager.updateTheme(primaryTheme);
		themeManager.previewTheme(previewTheme);
		themeManager.clearPreview();

		assert.deepStrictEqual(events, [
			'themeChanging',
			'themeChanged',
			'themeChanging',
			'themeChanged',
			'themeChanging',
			'themeChanged',
		]);
	});
});
