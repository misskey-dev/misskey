/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as mfm from 'mfm-js';
import { unique } from '@/scripts/array.js';

// unique without hash
// [ http://a/#1, http://a/#2, http://b/#3 ] => [ http://a/#1, http://b/#3 ]
const removeHash = (x: string) => x.replace(/#[^#]*$/, '');

export function extractUrlFromMfm(nodes: mfm.MfmNode[], respectSilentFlag = true): string[] {
	const quotedUrlNodes = mfm.extract(nodes, (node) => {
		return (node.type === 'quote') && (node.children.length === 1) && (node.children[0].type === 'url');
	}).map(quote => quote.children[0]);
	const urlNodes = mfm.extract(nodes, (node) => {
		return (node.type === 'url' && !quotedUrlNodes.includes(node)) || (node.type === 'link' && (!respectSilentFlag || !node.props.silent));
	});
	const urls: string[] = unique(urlNodes.map(x => x.props.url));

	return urls.reduce((array, url) => {
		const urlWithoutHash = removeHash(url);
		if (!array.map(x => removeHash(x)).includes(urlWithoutHash)) array.push(url);
		return array;
	}, [] as string[]);
}
