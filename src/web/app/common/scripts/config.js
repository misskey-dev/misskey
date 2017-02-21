const url = new URL(location.href);

const isRoot = url.host.split('.')[0] == 'misskey';

const host = isRoot ? url.host : url.host.substring(url.host.indexOf('.') + 1, url.host.length);
const scheme = url.protocol;
const apiUrl = `${scheme}//api.${host}`;
const devUrl = `${scheme}//dev.${host}`;
const aboutUrl = `${scheme}//about.${host}`;

module.exports = {
	host,
	scheme,
	apiUrl,
	devUrl,
	aboutUrl,
	themeColor: '#f76d6c'
};
