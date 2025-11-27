/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AiSON, errors } from '@syuilo/aiscript';
import type { Plugin } from 'rollup';
import { createFilter, dataToEsm } from '@rollup/pluginutils';
import { RollupJsonOptions } from '@rollup/plugin-json';

export default function pluginAison(options: RollupJsonOptions = {}): Plugin {
	const filter = createFilter(options.include, options.exclude);
	const indent = 'indent' in options ? options.indent : '\t';

	return {
		name: 'aison',

		// eslint-disable-next-line no-shadow
		transform(json, id) {
			if (id.slice(-6) !== '.aison' || !filter(id)) return null;

			try {
				const parsed = AiSON.parse(json);
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
				if (!(err instanceof errors.AiScriptSyntaxError)) {
					throw err;
				}
				const message = 'Could not parse AiSON file';
				const { line, column } = err.pos;
				this.warn({ message, id, loc: { line, column } });
				return null;
			}
		},
	};
}
