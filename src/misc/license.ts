import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

//const _filename = fileURLToPath(import.meta.url);
const _filename = __filename;
const _dirname = dirname(_filename);

const license = fs.readFileSync(_dirname + '/../../LICENSE', 'utf-8');

const licenseHtml = license
	.replace(/\r\n/g, '\n')
	.replace(/(.)\n(.)/g, '$1 $2')
	.replace(/(^|\n)(.*?)($|\n)/g, '<p>$2</p>');

export {
	license,
	licenseHtml
};
