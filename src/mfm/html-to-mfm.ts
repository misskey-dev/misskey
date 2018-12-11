const parse5 = require('parse5');
import { URL } from 'url';
import { switchMap } from '../prelude/functional-syntax';

export default function(html: string): string {
	if (html == null) return null;

	const nodes: any[] = parse5.parseFragment(html).childNodes;

	return nodes.reduce((a: string, c: any) => a + analyze(c), '').trim();

	function getText(node: any): string {
		return (
			node.nodeName == '#text' ? node.value :
			node.childNodes ? node.childNodes.map(getText).join('') :
			'');
	}

	function analyze(node: any): string {
		return switchMap(node.nodeName, analyzeChildren(node),
			['#text', node.value as string],
			['br', '\n'],
			['a', analyzeLink(node)],
			['p', `\n\n${analyzeChildren(node)}`]);
	}

	function analyzeChildren(node: any): string {
		return node.childNodes ? (node.childNodes as any[]).reduce((a: string, c: any) => a + analyze(c), '') : '';
	}

	function analyzeLink(node: any): string {
		const txt = getText(node);
		const rel = node.attrs.find((x: any) => x.name == 'rel');
		const href = node.attrs.find((x: any) => x.name == 'href');
		const part = txt.split('@');

		return (
			(rel && rel.value.match('tag') !== null) || !href || href.value == txt ? txt : // ハッシュタグ / hrefがない / txtがURL
			part.length && !part[0].length ? switchMap(part.length, '', // メンション
				[2, `${txt}@${(new URL(href.value)).hostname}`], // ホスト名部分が省略されているので復元する
				[3, txt]) :
			`[${txt}](${href.value})`); // その他
	}
}
