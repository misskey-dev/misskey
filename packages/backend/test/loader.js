/**
 * ts-node/esmローダーに投げる前にpath mappingを解決する
 * 参考
 * - https://github.com/TypeStrong/ts-node/discussions/1450#discussioncomment-1806115
 * - https://nodejs.org/api/esm.html#loaders
 * ※ https://github.com/TypeStrong/ts-node/pull/1585 が取り込まれたらこのカスタムローダーは必要なくなる
 */

import { resolve as resolveTs, load } from 'ts-node/esm';
import { loadConfig, createMatchPath } from 'tsconfig-paths';
import { pathToFileURL } from 'url';

const tsconfig = loadConfig();
const matchPath = createMatchPath(tsconfig.absoluteBaseUrl, tsconfig.paths);

export function resolve(specifier, ctx, defaultResolve) {
	let resolvedSpecifier;
	if (specifier.endsWith('.js')) {
		// maybe transpiled
		const specifierWithoutExtension = specifier.substring(0, specifier.length - '.js'.length);
		const matchedSpecifier = matchPath(specifierWithoutExtension);
		if (matchedSpecifier) {
			resolvedSpecifier = pathToFileURL(`${matchedSpecifier}.js`).href;
		}
	} else {
		const matchedSpecifier = matchPath(specifier);
		if (matchedSpecifier) {
			resolvedSpecifier = pathToFileURL(matchedSpecifier).href;
		}
	}
	return resolveTs(resolvedSpecifier ?? specifier, ctx, defaultResolve);
}

export { load };
