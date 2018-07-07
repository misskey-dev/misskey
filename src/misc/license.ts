import * as fs from 'fs';

const license = fs.readFileSync(__dirname + '/../../LICENSE', 'utf-8');

const licenseHtml = license
	.replace(/\r\n/g, '\n')
	.replace(/(.)\n(.)/g, '$1 $2')
	.replace(/(^|\n)(.*?)($|\n)/g, '<p>$2</p>');

export {
	license,
	licenseHtml
};
