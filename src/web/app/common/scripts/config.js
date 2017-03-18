const Url = new URL(location.href);

const isRoot = Url.host.split('.')[0] == 'misskey';

const host = isRoot ? Url.host : Url.host.substring(Url.host.indexOf('.') + 1, Url.host.length);
const scheme = Url.protocol;
const url = `${scheme}//${host}`;
const apiUrl = `${scheme}//api.${host}`;
const devUrl = `${scheme}//dev.${host}`;
const aboutUrl = `${scheme}//about.${host}`;

export default {
	host,
	scheme,
	url,
	apiUrl,
	devUrl,
	aboutUrl
};
