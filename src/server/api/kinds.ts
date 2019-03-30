import endpoints from './endpoints';
import * as locale from '../../../locales/';
import { fromEntries } from '../../prelude/array';

export interface IKindInfo {
	endpoints: string[];
	descs: { [x: string]: string; };
}

export function kinds() {
	const kinds = fromEntries(
		Object.keys(locale['ja-JP'].common.permissions)
			.map(k => [k, {
					endpoints: [],
					descs: fromEntries(
						Object.keys(locale)
							.map(l => [l, locale[l].common.permissions[k] as string] as [string, string])
						) as { [x: string]: string; }
				}] as [ string, IKindInfo ])
			) as { [x: string]: IKindInfo; };

	for (const endpoint of endpoints.filter(ep => !ep.meta.secure)) {
		if (endpoint.meta.kind) {
			const kind = endpoint.meta.kind;
			if (kind in kinds) kinds[kind].endpoints.push(endpoint.name);
			else throw Error(`Unknown kind (permission) found at ${endpoint.name}.`);
		}
	}

	return kinds;
}
