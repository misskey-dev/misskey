import { writeFileSync } from 'fs';
import { join } from 'path';
import { genOpenapiSpec } from '../server/api/openapi/gen-spec';

export default () => {
	writeFileSync(join(__dirname, '../../built/client/assets/api.json'), JSON.stringify(genOpenapiSpec()));
	console.log('Done!');
	process.exit(0);
};
