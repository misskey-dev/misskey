import * as mfm from 'mfm-js';
import { unique } from '@/prelude/array';

// unique without hash
// [ http://a/#1, http://a/#2, http://b/#3 ] => [ http://a/#1, http://b/#3 ]
const removeHash = (x: string) => x.replace(/#[^#]*$/, '');

export function extractUrlFromMfm(nodes: mfm.MfmNode[], respectSilentFlag = true): string[] {
	const urlNodes = [] as (mfm.MfmUrl | mfm.MfmLink)[];

	function scan(nodes: mfm.MfmNode[]) {
		for (const node of nodes) {
			if (node.type === 'url') {
				urlNodes.push(node);
			} else if (node.type === 'link') {
				if (!respectSilentFlag || !node.props.silent) {
					urlNodes.push(node);
				}
			} else if (node.children) {
				scan(node.children);
			}
		}
	}

	scan(nodes);

	const urls = unique(urlNodes.map(x => x.props.url));

	return urls.reduce((array, url) => {
		const removed = removeHash(url);
		if (!array.map(x => removeHash(x)).includes(removed)) array.push(url);
		return array;
	}, [] as string[]);
}
