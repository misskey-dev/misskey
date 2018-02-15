const loaderUtils = require('loader-utils');

function trim(text) {
	return text.substring(1, text.length - 2);
}

module.exports = function(src) {
	this.cacheable();
	const options = loaderUtils.getOptions(this);
	const search = options.search;
	const replace = global[options.replace];
	if (typeof search != 'string' || search.length == 0) console.error('invalid search');
	if (typeof replace != 'function') console.error('invalid replacer:', replace, this.request);
	src = src.replace(new RegExp(trim(search), 'g'), replace);
	this.callback(null, src);
	return src;
};
