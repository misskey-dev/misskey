import * as mfm from 'mfm-js';
import { unique } from '@/prelude/array';

// unique without hash
// [ http://a/#1, http://a/#2, http://b/#3 ] => [ http://a/#1, http://b/#3 ]
const removeHash = (x: string) => x.replace(/#[^#]*$/, '');

export function extractUrlFromMfm(nodes: mfm.MfmNode[], respectSilentFlag = true): string[] {
	let urls = [] as string[];

	mfm.inspect(nodes, (node) => {
		if (node.type === 'url') {
			urls.push(node.props.url);
		} else if (node.type === 'link' && (!respectSilentFlag || !node.props.silent)) {
			urls.push(node.props.url);
		}
	});

	urls = unique(urls);

	return urls.reduce((array, url) => {
		const urlWithoutHash = removeHash(url);
		if (!array.map(x => removeHash(x)).includes(urlWithoutHash)) array.push(url);
		return array;
	}, [] as string[]);
}
