/**
 * Code (block)
 */

import genHtml from '../core/syntax-highlighter';

module.exports = text => {
	const match = text.match(/^```([\s\S]+?)```/);
	if (!match) return null;
	const code = match[0];
	return {
		type: 'code',
		content: code,
		code: code.substr(3, code.length - 6).trim(),
		html: genHtml(code.substr(3, code.length - 6).trim())
	};
};
