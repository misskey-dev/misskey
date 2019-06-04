import { parseFragment, DefaultTreeDocumentFragment, DefaultTreeNode, DefaultTreeTextNode, DefaultTreeElement, DefaultTreeParentNode } from 'parse5';
import { URL } from 'url';
import { concat } from '../prelude/string';
import { urlRegex } from './prelude';

export function fromHtml(html: string): string {
	const dom = parseFragment(html) as DefaultTreeDocumentFragment;

	let text = '';

	for (const n of dom.childNodes) {
		analyze(n);
	}

	return text.trim();

	function getText(unknownNode: DefaultTreeNode): string {
		if (unknownNode.nodeName == '#text') {
			const node = unknownNode as DefaultTreeTextNode;

			return node.value;
		}

		if ('childNodes' in unknownNode) {
			const node = unknownNode as DefaultTreeParentNode;

			return concat(node.childNodes.map(getText));
		}

		return '';
	}

	function analyze(unknownNode: DefaultTreeNode) {
		switch (unknownNode.nodeName) {
			case '#text': {
				const node = unknownNode as DefaultTreeTextNode;

				text += node.value;
				break;
			}

			case 'br': {
				text += '\n';
				break;
			}

			case 'a': {
				const node = unknownNode as DefaultTreeElement;

				const txt = getText(node);
				const rel = node.attrs.find(x => x.name == 'rel');
				const href = node.attrs.find(x => x.name == 'href');
				const isHashtag = rel && rel.value.match('tag') !== null;

				// ハッシュタグ / hrefがない / txtがURL
				if (isHashtag || !href || href.value == txt) {
					text += isHashtag || txt.match(urlRegex) ? txt : `<${txt}>`;
				// メンション
				} else if (txt.startsWith('@') && !(rel && rel.value.match(/^me /))) {
					const part = txt.split('@');

					if (part.length == 2) {
						//#region ホスト名部分が省略されているので復元する
						const acct = `${txt}@${(new URL(href.value)).hostname}`;
						text += acct;
						//#endregion
					} else if (part.length == 3) {
						text += txt;
					}
				// その他
				} else {
					text += `[${txt}](${href.value})`;
				}
				break;
			}

			case 'p': {
				const node = unknownNode as DefaultTreeElement;

				text += '\n\n';
				if (node.childNodes) {
					for (const n of node.childNodes) {
						analyze(n);
					}
				}
				break;
			}

			default: {
				const node = unknownNode as unknown as DefaultTreeParentNode;

				if (node.childNodes) {
					for (const n of node.childNodes) {
						analyze(n);
					}
				}
				break;
			}
		}
	}
}
