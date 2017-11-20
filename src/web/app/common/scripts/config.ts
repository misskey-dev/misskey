const _url = new URL(location.href);

const isRoot = _url.host == 'localhost'
	? true
	: _url.host.split('.')[0] == 'misskey';

const host = isRoot ? _url.host : _url.host.substring(_url.host.indexOf('.') + 1, _url.host.length);
const scheme = _url.protocol;
const url = `${scheme}//${host}`;
const apiUrl = `${scheme}//api.${host}`;
const chUrl = `${scheme}//ch.${host}`;
const devUrl = `${scheme}//dev.${host}`;
const aboutUrl = `${scheme}//about.${host}`;
const statsUrl = `${scheme}//stats.${host}`;
const statusUrl = `${scheme}//status.${host}`;

export default {
	host,
	scheme,
	url,
	apiUrl,
	chUrl,
	devUrl,
	aboutUrl,
	statsUrl,
	statusUrl
};
