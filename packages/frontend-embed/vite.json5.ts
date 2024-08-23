// Original: https://github.com/rollup/plugins/tree/8835dd2aed92f408d7dc72d7cc25a9728e16face/packages/json

import JSON5 from 'json5';
import { Plugin } from 'rollup';
import { createFilter, dataToEsm } from '@rollup/pluginutils';
import { RollupJsonOptions } from '@rollup/plugin-json';

// json5 extends SyntaxError with additional fields (without subclassing)
// https://github.com/json5/json5/blob/de344f0619bda1465a6e25c76f1c0c3dda8108d9/lib/parse.js#L1111-L1112
interface Json5SyntaxError extends SyntaxError {
	lineNumber: number;
	columnNumber: number;
}

export default function json5(options: RollupJsonOptions = {}): Plugin {
	const filter = createFilter(options.include, options.exclude);
	const indent = 'indent' in options ? options.indent : '\t';

	return {
		name: 'json5',

		// eslint-disable-next-line no-shadow
		transform(json, id) {
			if (id.slice(-6) !== '.json5' || !filter(id)) return null;

			try {
				const parsed = JSON5.parse(json);
				return {
					code: dataToEsm(parsed, {
						preferConst: options.preferConst,
						compact: options.compact,
						namedExports: options.namedExports,
						indent,
					}),
					map: { mappings: '' },
				};
			} catch (err) {
				if (!(err instanceof SyntaxError)) {
					throw err;
				}
				const message = 'Could not parse JSON5 file';
				const { lineNumber, columnNumber } = err as Json5SyntaxError;
				this.warn({ message, id, loc: { line: lineNumber, column: columnNumber } });
				return null;
			}
		},
	};
}
