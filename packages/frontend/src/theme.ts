/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO: (可能な部分を)sharedに抽出して frontend-embed と共通化

import { ref, nextTick } from 'vue';
import { EventEmitter } from 'eventemitter3';
import lightTheme from '@@/themes/_light.json5';
import darkTheme from '@@/themes/_dark.json5';
import { version } from '@@/js/config.js';
import { getBuiltinThemes, parseThemeCode, themeProps, compile } from '@@/js/theme.js';
import type { Theme, CompiledTheme } from '@@/js/theme.js';
import { deepClone } from '@/utility/clone.js';
import { miLocalStorage } from '@/local-storage.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { prefer } from '@/preferences.js';

type ThemeManagerEvents = {
	'themeChanging': () => void;
	'themeChanged': () => void;
	'previewStateChanged': (isPreview: boolean) => void;
	'requestUpdateThemeCache': (theme: Theme, compiled: CompiledTheme) => void;
};

class ThemeManager extends EventEmitter<ThemeManagerEvents> {
	/** 現在常用しているテーマ */
	private _theme: Theme | null = null;
	get theme() { return this._theme; }
	private _compiledTheme: CompiledTheme | null = null;
	get compiledTheme() { return this._compiledTheme; }

	/** 現在適用中のテーマ */
	private _currentTheme: Theme | null = null;
	get currentTheme() { return this._currentTheme; }
	get currentThemeId() { return this._currentTheme?.id; }
	private _currentCompiledTheme: CompiledTheme | null = null;
	get currentCompiledTheme() { return this._currentCompiledTheme; }

	/** プレビュー中かどうか */
	private _isPreviewMode = false;
	get isPreviewMode() { return this._isPreviewMode; }
	set isPreviewMode(value: boolean) {
		if (this._isPreviewMode !== value) {
			this._isPreviewMode = value;
			this.emit('previewStateChanged', value);
		}
	}

	constructor() {
		super();
	}

	/** テーマを更新し、同時に適用します。 */
	public updateTheme(newTheme: Theme) {
		if (newTheme.id === this.theme?.id && version === miLocalStorage.getItem('themeCachedVersion')) return; // 変更なし

		this.isPreviewMode = false;

		// テーマを更新
		this._theme = deepClone(newTheme);
		const compiled = this.compile(newTheme);
		this._compiledTheme = compiled;

		// 適用中のテーマも更新
		this._currentTheme = deepClone(this.theme);
		this._currentCompiledTheme = deepClone(compiled);

		this.applyTheme();
	}

	/** プレビュー用のテーマを適用します。 */
	public previewTheme(theme: Theme) {
		this.isPreviewMode = true;

		// 適用中のテーマを更新
		this._currentTheme = deepClone(theme);
		this._currentCompiledTheme = this.compile(theme);

		this.applyTheme();
	}

	/** プレビュー状態を解除し、適用中のテーマを常用しているテーマに戻します。 */
	public clearPreview() {
		this.isPreviewMode = false;

		// 適用中のテーマを常用しているテーマに戻す
		this._currentTheme = deepClone(this.theme);
		this._currentCompiledTheme = deepClone(this.compiledTheme);

		this.applyTheme();
	}

	/** 通常のテーマのコンパイルに加え、ベースとなるテーマの値を解決し代入します。 */
	private compile(theme: Theme) {
		const _theme = deepClone(theme);

		if (_theme.base != null) {
			const base = [lightTheme, darkTheme].find(x => x.id === _theme.base);
			if (base) _theme.props = Object.assign({}, base.props, _theme.props);
		}

		return compile(_theme);
	}

	/** currentThemeを適用します。 */
	private applyTheme() {
		if (this.currentTheme == null || this.currentCompiledTheme == null) return;

		// visibilityStateがhiddenな状態でstartViewTransitionするとブラウザによってはエラーになる
		// 通常hiddenな時に呼ばれることはないが、iOSのPWAだとアプリ切り替え時に(何故か)hiddenな状態で(何故か)一瞬デバイスのダークモード判定が変わりapplyThemeが呼ばれる場合がある
		if (window.document.startViewTransition != null && window.document.visibilityState === 'visible') {
			window.document.documentElement.classList.add('_themeChanging_');
			try {
				window.document.startViewTransition(async () => {
					this.updateAttributes();
					await nextTick();
				}).finished.then(() => {
					window.document.documentElement.classList.remove('_themeChanging_');
					this.emit('themeChanged');
				});
			} catch (err) {
				// 様々な理由により startViewTransition は失敗することがある
				// ref. https://github.com/misskey-dev/misskey/issues/16562

				// FIXME: viewTransitonエラーはtry~catch貫通してそうな気配がする
				console.error(err);

				window.document.documentElement.classList.remove('_themeChanging_');
				this.updateAttributes();
				this.emit('themeChanged');
			}
		} else {
			this.updateAttributes();
			this.emit('themeChanged');
		}

		if (!this.isPreviewMode) {
			this.emit('requestUpdateThemeCache', this.currentTheme, this.currentCompiledTheme);
		}
	}

	private updateAttributes() {
		if (!this.currentTheme || !this.currentCompiledTheme) return;

		const colorScheme = this.currentTheme.base === 'dark' ? 'dark' : 'light';
		window.document.documentElement.dataset.colorScheme = colorScheme;

		for (const tag of window.document.head.children) {
			if (tag.tagName === 'META' && tag.getAttribute('name') === 'theme-color') {
				tag.setAttribute('content', this.currentCompiledTheme['htmlThemeColor']);
				break;
			}
		}

		for (const key of themeProps) {
			const value = this.currentCompiledTheme[key];
			if (value) {
				window.document.documentElement.style.setProperty(`--MI_THEME-${key}`, value.toString());
			} else {
				window.document.documentElement.style.removeProperty(`--MI_THEME-${key}`);
			}
		}

		window.document.documentElement.style.setProperty('color-scheme', colorScheme);

		this.emit('themeChanging');
	}
}

export const themeManager = new ThemeManager();
export const isPreviewMode = ref(false);

themeManager.on('requestUpdateThemeCache', (theme, props) => {
	miLocalStorage.setItem('theme', JSON.stringify(props));
	miLocalStorage.setItem('themeId', theme.id);
	miLocalStorage.setItem('themeCachedVersion', version);
});

themeManager.on('previewStateChanged', (preview) => {
	isPreviewMode.value = preview;
});

export async function addTheme(theme: Theme): Promise<void> {
	if ($i == null) return;
	const builtinThemes = await getBuiltinThemes();
	if (builtinThemes.some(t => t.id === theme.id)) {
		throw new Error('builtin theme');
	}
	const themes = prefer.s.themes;
	if (themes.some(t => t.id === theme.id)) {
		throw new Error('already exists');
	}
	prefer.commit('themes', [...themes, theme]);
}

export async function removeTheme(theme: Theme): Promise<void> {
	if ($i == null) return;
	const themes = prefer.s.themes.filter(t => t.id !== theme.id);
	prefer.commit('themes', themes);
}

export async function installTheme(code: string): Promise<void> {
	const theme = parseThemeCode(code);
	if (theme == null) return;
	await addTheme(theme);
}

export function clearAppliedThemeCache() {
	miLocalStorage.removeItem('theme');
	miLocalStorage.removeItem('themeId');
	miLocalStorage.removeItem('themeCachedVersion');
}

export function handleThemeInstallError(err: unknown) {
	if (err instanceof Error) {
		let message = '';
		switch (err.message.toLowerCase()) {
			case 'this theme is already installed':
			case 'already exists':
			case 'builtin theme':
				message = i18n.ts._theme.alreadyInstalled;
				break;
			default:
				message = i18n.ts._theme.invalid;
				break;
		}

		os.alert({
			type: 'error',
			text: message,
		});
	}

	console.error(err);
}
