const parse5 = require('parse5');

export default function(html: string): string {
	if (html == null) return null;

	const dom = parse5.parseFragment(html);

	let text = '';

	dom.childNodes.forEach((n: any) => analyze(n));

	return text.trim();

	function getText(node: any) {
		if (node.nodeName == '#text') return node.value;

		if (node.childNodes) {
			return node.childNodes.map((n: any) => getText(n)).join('');
		}

		return '';
	}

	function analyze(node: any) {
		switch (node.nodeName) {
			case '#text':
				text += node.value;
				break;

			case 'br':
				text += '\n';
				break;

			case 'a':
				const txt = getText(node);
				const rel = node.attrs.find((x: any) => x.name == 'rel');
				const href = node.attrs.find((x: any) => x.name == 'href');

				// ハッシュタグ / hrefがない / txtがURL
				if ((rel && rel.value.match('tag') !== null) || !href || href.value == txt) {
					text += txt;
				// メンション
				} else if (txt.startsWith('@')) {
					const part = txt.split('@');

					if (part.length == 2) {
						//#region ホスト名部分が省略されているので復元する
						const acct = `${txt}@${(new URL(href.value)).hostname}`;
						text += acct;
						break;
						//#endregion
					} else if (part.length == 3) {
						text += txt;
						break;
					}
				// その他
				} else {
					text += `[${txt}](${href.value})`;
				}
				break;

			case 'p':
				text += '\n\n';
				if (node.childNodes) {
					node.childNodes.forEach((n: any) => analyze(n));
				}
				break;

			default:
				if (node.childNodes) {
					node.childNodes.forEach((n: any) => analyze(n));
				}
				break;
		}
	}
}
