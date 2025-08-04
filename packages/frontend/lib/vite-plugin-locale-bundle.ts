/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/// <reference lib="esnext" />

import type { PluginOption, Plugin } from 'vite';
import MagicString from 'magic-string';
import { init, parse as parseImports } from 'es-module-lexer'

export type Options = {
};


export default function pluginLocaleBundle(options: Options = {}): PluginOption {
	return [
		pluginLocaleBundleMain(options),
	]
}

function pluginLocaleBundleMain(options: Options): Plugin {
	return {
		name: 'pluginLocaleBundleMain',
		enforce: undefined, // normal plugin

		async transform(code, id) {
			// find locale from the id
			const lang = id.match(/[?&]lang=([a-zA-Z-]+)($|&)/)?.[1];
			if (!lang) {
				// not a locale bundle
				return;
			}

			await init; // Ensure es-module-lexer is initialized

			const magicCode = new MagicString(code);

			const [imports] = parseImports(code);

			for (let importSpecifier of imports) {
				if (importSpecifier.n == null) continue; // completely dynamic (with expression) imports

				// for static imports, specifier is interior of the literal like `asdf.js`
				// for dynamic imports, specifier is the whole import target expression like `"./asdf.js"`
				const specifier = code.substring(importSpecifier.s, importSpecifier.e);
				if (specifier.match(/\.(js|vue)($|\?|["'])/)) {
					// If importing a JS file, append ?lang=lang (or &lang=lang if already has query params)
					const newSpecifier =
						specifier.includes('?') ? specifier.replace('?', `?lang=${lang}&`)
						: specifier.match(/['"]$/) ? specifier.replace(/['"]$/, quote => `?lang=${lang}${quote}`)
						: `${specifier}?lang=${lang}`;
					magicCode.overwrite(importSpecifier.s, importSpecifier.e, newSpecifier);
				}
			}

			return {
				code: magicCode.toString(),
				map: magicCode.generateMap({ hires: true }),
			}
		},
	};
}
