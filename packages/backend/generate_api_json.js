import { loadConfig } from './built/config.js'
import { genOpenapiSpec } from './built/server/api/openapi/gen-spec.js'
import { writeFileSync } from 'node:fs';
import { argv } from 'node:process';

const skipGet = argv.includes('--skip-get');

const config = loadConfig();
const spec = genOpenapiSpec(config, skipGet);

const path = `./built/api${skipGet ? '-get-skipped' : ''}.json`;

writeFileSync(path, JSON.stringify(spec), 'utf-8');
