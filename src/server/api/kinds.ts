import endpoints from './endpoints';
import * as locale from '../../../locales/';
import { fromEntries } from '../../prelude/array';

export const kindsList = [
	'read:account',
	'write:account',
	'read:blocks',
	'write:blocks',
	'read:drive',
	'write:drive',
	'read:favorites',
	'write:favorites',
	'read:following',
	'write:following',
	'read:messaging',
	'write:messaging',
	'read:mutes',
	'write:mutes',
	'write:notes',
	'read:notifications',
	'write:notifications',
	'read:reactions',
	'write:reactions',
	'write:votes'
];

export interface IKindInfo {
	endpoints: string[];
	descs: { [x: string]: string; };
}

export function kinds() {
	const kinds = fromEntries(
		kindsList
			.map(k => [k, {
					endpoints: [],
					descs: fromEntries(
						Object.keys(locale)
							.map(l => [l, locale[l].common.permissions[k] as string] as [string, string])
						) as { [x: string]: string; }
				}] as [ string, IKindInfo ])
			) as { [x: string]: IKindInfo; };

	const errors = [] as string[][];

	for (const endpoint of endpoints.filter(ep => !ep.meta.secure)) {
		if (endpoint.meta.kind) {
			const kind = endpoint.meta.kind;
			if (kind in kinds) kinds[kind].endpoints.push(endpoint.name);
			else errors.push([kind, endpoint.name]);
		}
	}

	if (errors.length > 0) throw Error('\n  ' + errors.map((e) => `Unknown kind (permission) "${e[0]}" found at ${e[1]}.`).join('\n  '));

	return kinds;
}
