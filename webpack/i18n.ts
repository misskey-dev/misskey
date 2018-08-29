/**
 * Replace i18n texts
 */

export const pattern = /%i18n:([a-z0-9_\-@\.]+?)%/g;

export const replacement = (ctx: any, _: any, key: string) => {
	const client = '/src/client/app/';
	let name = null;

	if (key.startsWith('@')) {
		name = ctx.src.substr(ctx.src.indexOf(client) + client.length);
		key = key.substr(1);
	}

	const path = name ? `${name}|${key}` : key;

	return `%i18n:${path}%`;
};
