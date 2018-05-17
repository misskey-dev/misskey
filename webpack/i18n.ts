/**
 * Replace i18n texts
 */

export const pattern = /%i18n:([a-z0-9_\-@\.\!]+?)%/g;

export const replacement = (ctx, match, key) => {
	const client = '/src/client/app/';
	let name = null;

	const shouldEscape = key[0] == '!';
	if (shouldEscape) {
		key = key.substr(1);
	}

	if (key[0] == '@') {
		name = ctx.src.substr(ctx.src.indexOf(client) + client.length);
		key = key.substr(1);
	}

	const path = name ? `${name}|${key}` : key;

	return shouldEscape ? `%i18n:!${path}%` : `%i18n:${path}%`;
};
