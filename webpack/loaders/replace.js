import { getOptions } from 'loader-utils';

function trim(text, g) {
	return text.substring(1, text.length - (g ? 2 : 0));
}

export default function(src) {
	const fn = options => {
		const search = options.search;
		const g = search[search.length - 1] == 'g';
		const file = this.resourcePath.replace(/\\/g, '/');
		const replace = options.i18n ? global[options.replace].bind(null, {
			src: file,
			lang: options.lang
		}) : global[options.replace];
		if (typeof search != 'string' || search.length == 0) console.error('invalid search');
		if (typeof replace != 'function') console.error('invalid replacer:', replace, this.request);
		src = src.replace(new RegExp(trim(search, g), g ? 'g' : ''), replace);
	};

	this.cacheable();
	const options = getOptions(this);
	if (options.qs) {
		options.qs.forEach(q => fn(q));
	} else {
		fn(options);
	}
	this.callback(null, src);
	return src;
}
