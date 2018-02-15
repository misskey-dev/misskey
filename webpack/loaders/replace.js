const loaderUtils = require('loader-utils');

function trim(text) {
	return text.substring(1, text.length - 2);
}

module.exports = function(src) {
	this.cacheable();
	const options = loaderUtils.getOptions(this);
	if (typeof options.search != 'string' || options.search.length == 0) console.error('invalid search');
	if (typeof options.replace != 'function') console.error('invalid replacer');
	src = src.replace(new RegExp(trim(options.search), 'g'), options.replace);
	this.callback(null, src);
	return src;
};
