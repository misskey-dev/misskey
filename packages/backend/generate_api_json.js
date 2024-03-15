import { loadConfig } from './built/config.js'
import { genOpenapiSpec } from './built/server/api/openapi/gen-spec.js'
import { writeFileSync } from "node:fs";

const config = loadConfig();
const spec = genOpenapiSpec(config, true);

writeFileSync('./built/api.json', JSON.stringify(spec), 'utf-8');