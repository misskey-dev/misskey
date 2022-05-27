// Original: https://github.com/rollup/plugins/tree/8835dd2aed92f408d7dc72d7cc25a9728e16face/packages/json

import JSON5 from 'json5';
import { Plugin } from 'rollup';
import { createFilter, dataToEsm } from '@rollup/pluginutils';
import { RollupJsonOptions } from '@rollup/plugin-json';

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
            indent
          }),
          map: { mappings: '' }
        };
      } catch (err) {
        const message = 'Could not parse JSON file';
        const position = parseInt(/[\d]/.exec(err.message)[0], 10);
        this.warn({ message, id, position });
        return null;
      }
    }
  };
}
