/**
 * Link
 */

module.exports = text => {
	const match = text.match(/^\??\[([^\[\]]+?)\]\((https?:\/\/[\w\/:%#@\$&\?!\(\)\[\]~\.=\+\-]+?)\)/);
	if (!match) return null;
	const silent = text[0] == '?';
	const link = match[0];
	const title = match[1];
	const url = match[2];
	return {
		type: 'link',
		content: link,
		title: title,
		url: url,
		silent: silent
	};
};
