const Url = new URL(location.href);

const isRoot = Url.host.split('.')[0] == 'misskey';

const host = isRoot ? Url.host : Url.host.substring(Url.host.indexOf('.') + 1, Url.host.length);
const scheme = Url.protocol;
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
