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
	const urlNodes = mfm.extract(nodes, (node) => {
		return (node.type === 'url') || (node.type === 'link');
	});
	const urls = unique(urlNodes.map(x => {
		return x.type === 'url'
			? ({
				href: x.props.url,
				text: x.props.url,
				preview: true,
			})
			: ({
				href: x.props.url,
				text: extractTextValues(x.children) ?? [],
				preview: (!respectSilentFlag || !x.props.silent),
			})
	}));

	return urls.reduce((array, url) => {
		const urlWithoutHash = removeHash(url.href);
		if (!array.map(x => removeHash(x.href)).includes(urlWithoutHash)) array.push(url);
		return array;
	}, []);
}

function extractTextValues(obj: mfm.MfmNode) {
  const textValues = [];

  function traverse(o) {
    if (Array.isArray(o)) {
      o.forEach(item => traverse(item));
    } else if (o && typeof o === 'object') {
      if (o.type === 'text') {
        textValues.push(o.props.text);
      } else if (o.children) {
        o.children.forEach(child => traverse(child));
      }
    }
  }

  traverse(obj);
  return textValues;
}
