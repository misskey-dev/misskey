import endpoints from '../endpoints';
import * as locale from '../../../../locales/';
import { kinds as kindsList } from '../kinds';

export interface IKindInfo {
	endpoints: string[];
	descs: { [x: string]: string; };
}

export function kinds() {
	const kinds = Object.fromEntries(
		kindsList
			.map(k => [k, {
					endpoints: [],
					descs: Object.fromEntries(
						Object.keys(locale)
							.map(l => [l, locale[l]._permissions[k] as string])
						)
				} as IKindInfo])
			);

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

export function getDescription(lang = 'ja-JP'): string {
	const permissionTable = Object.entries(kinds())
		.map(e => `|${e[0]}|${e[1].descs[lang]}|${e[1].endpoints.map(f => `[${f}](#operation/${f})`).join(', ')}|`)
		.join('\n');

	const descriptions: { [x: string]: string } = {
		'ja-JP': `
# Permissions
|Permisson (kind)|Description|Endpoints|
|:--|:--|:--|
${permissionTable}
`
	};
	return lang in descriptions ? descriptions[lang] : descriptions['ja-JP'];
}
