/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import * as parse5 from 'parse5';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { intersperse } from '@/misc/prelude/array.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import type { IMentionedRemoteUsers } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';
import { escapeHtml } from '@/misc/escape-html.js';
import type { DefaultTreeAdapterMap } from 'parse5';
import type * as mfm from 'mfm-js';

const treeAdapter = parse5.defaultTreeAdapter;
type Node = DefaultTreeAdapterMap['node'];
type ChildNode = DefaultTreeAdapterMap['childNode'];

const urlRegex = /^https?:\/\/[\w\/:%#@$&?!()\[\]~.,=+\-]+/;
const urlRegexFull = /^https?:\/\/[\w\/:%#@$&?!()\[\]~.,=+\-]+$/;

@Injectable()
export class MfmService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
	}

	@bindThis
	public fromHtml(html: string, hashtagNames?: string[]): string {
		// some AP servers like Pixelfed use br tags as well as newlines
		html = html.replace(/<br\s?\/?>\r?\n/gi, '\n');

		const normalizedHashtagNames = hashtagNames == null ? undefined : new Set<string>(hashtagNames.map(x => normalizeForSearch(x)));

		const dom = parse5.parseFragment(html);

		let text = '';

		for (const n of dom.childNodes) {
			analyze(n);
		}

		return text.trim();

		function getText(node: Node): string {
			if (treeAdapter.isTextNode(node)) return node.value;
			if (!treeAdapter.isElementNode(node)) return '';
			if (node.nodeName === 'br') return '\n';

			if (node.childNodes) {
				return node.childNodes.map(n => getText(n)).join('');
			}

			return '';
		}

		function appendChildren(childNodes: ChildNode[]): void {
			if (childNodes) {
				for (const n of childNodes) {
					analyze(n);
				}
			}
		}

		function analyze(node: Node) {
			if (treeAdapter.isTextNode(node)) {
				text += node.value;
				return;
			}

			// Skip comment or document type node
			if (!treeAdapter.isElementNode(node)) {
				return;
			}

			switch (node.nodeName) {
				case 'br': {
					text += '\n';
					break;
				}

				case 'a': {
					const txt = getText(node);
					const rel = node.attrs.find(x => x.name === 'rel');
					const href = node.attrs.find(x => x.name === 'href');

					// ハッシュタグ
					if (normalizedHashtagNames && href && normalizedHashtagNames.has(normalizeForSearch(txt))) {
						text += txt;
						// メンション
					} else if (txt.startsWith('@') && !(rel && rel.value.startsWith('me '))) {
						const part = txt.split('@');

						if (part.length === 2 && href) {
							//#region ホスト名部分が省略されているので復元する
							const acct = `${txt}@${(new URL(href.value)).hostname}`;
							text += acct;
							//#endregion
						} else if (part.length === 3) {
							text += txt;
						}
						// その他
					} else {
						const generateLink = () => {
							if (!href && !txt) {
								return '';
							}
							if (!href) {
								return txt;
							}
							if (!txt || txt === href.value) {	// #6383: Missing text node
								if (href.value.match(urlRegexFull)) {
									return href.value;
								} else {
									return `<${href.value}>`;
								}
							}
							if (href.value.match(urlRegex) && !href.value.match(urlRegexFull)) {
								return `[${txt}](<${href.value}>)`;	// #6846
							} else {
								return `[${txt}](${href.value})`;
							}
						};

						text += generateLink();
					}
					break;
				}

				case 'h1': {
					text += '【';
					appendChildren(node.childNodes);
					text += '】\n';
					break;
				}

				case 'b':
				case 'strong': {
					text += '**';
					appendChildren(node.childNodes);
					text += '**';
					break;
				}

				case 'small': {
					text += '<small>';
					appendChildren(node.childNodes);
					text += '</small>';
					break;
				}

				case 's':
				case 'del': {
					text += '~~';
					appendChildren(node.childNodes);
					text += '~~';
					break;
				}

				case 'i':
				case 'em': {
					text += '<i>';
					appendChildren(node.childNodes);
					text += '</i>';
					break;
				}

				case 'ruby': {
					let ruby: [string, string][] = [];
					for (const child of node.childNodes) {
						if (child.nodeName === 'rp') {
							continue;
						}
						if (treeAdapter.isTextNode(child) && !/\s|\[|\]/.test(child.value)) {
							ruby.push([child.value, '']);
							continue;
						}
						if (child.nodeName === 'rt' && ruby.length > 0) {
							const rt = getText(child);
							if (/\s|\[|\]/.test(rt)) {
								// If any space is included in rt, it is treated as a normal text
								ruby = [];
								appendChildren(node.childNodes);
								break;
							} else {
								ruby.at(-1)![1] = rt;
								continue;
							}
						}
						// If any other element is included in ruby, it is treated as a normal text
						ruby = [];
						appendChildren(node.childNodes);
						break;
					}
					for (const [base, rt] of ruby) {
						text += `$[ruby ${base} ${rt}]`;
					}
					break;
				}

				// block code (<pre><code>)
				case 'pre': {
					if (node.childNodes.length === 1 && node.childNodes[0].nodeName === 'code') {
						text += '\n```\n';
						text += getText(node.childNodes[0]);
						text += '\n```\n';
					} else {
						appendChildren(node.childNodes);
					}
					break;
				}

				// inline code (<code>)
				case 'code': {
					text += '`';
					appendChildren(node.childNodes);
					text += '`';
					break;
				}

				case 'blockquote': {
					const t = getText(node);
					if (t) {
						text += '\n> ';
						text += t.split('\n').join('\n> ');
					}
					break;
				}

				case 'p':
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
				case 'h6': {
					text += '\n\n';
					appendChildren(node.childNodes);
					break;
				}

				// other block elements
				case 'div':
				case 'header':
				case 'footer':
				case 'article':
				case 'li':
				case 'dt':
				case 'dd': {
					text += '\n';
					appendChildren(node.childNodes);
					break;
				}

				default:	// includes inline elements
				{
					appendChildren(node.childNodes);
					break;
				}
			}
		}
	}

	@bindThis
	public toHtml(nodes: mfm.MfmNode[] | null, mentionedRemoteUsers: IMentionedRemoteUsers = [], extraHtml: string | null = null) {
		if (nodes == null) {
			return null;
		}

		function toHtml(children?: mfm.MfmNode[]): string {
			if (children == null) return '';
			return children.map(x => handlers[x.type](x)).join('');
		}

		function fnDefault(node: mfm.MfmFn) {
			return `<i>${toHtml(node.children)}</i>`;
		}

		const handlers = {
			bold: (node) => {
				return `<b>${toHtml(node.children)}</b>`;
			},

			small: (node) => {
				return `<small>${toHtml(node.children)}</small>`;
			},

			strike: (node) => {
				return `<del>${toHtml(node.children)}</del>`;
			},

			italic: (node) => {
				return `<i>${toHtml(node.children)}</i>`;
			},

			fn: (node) => {
				switch (node.props.name) {
					case 'unixtime': {
						const text = node.children[0].type === 'text' ? node.children[0].props.text : '';
						try {
							const date = new Date(parseInt(text, 10) * 1000);
							return `<time datetime="${escapeHtml(date.toISOString())}">${escapeHtml(date.toISOString())}</time>`;
						} catch (err) {
							return fnDefault(node);
						}
					}

					case 'ruby': {
						if (node.children.length === 1) {
							const child = node.children[0];
							const text = child.type === 'text' ? child.props.text : '';

							// ruby未対応のHTMLサニタイザーを通したときにルビが「対象テキスト（ルビテキスト）」にフォールバックするようにする
							return `<ruby>${escapeHtml(text.split(' ')[0])}<rp>(</rp><rt>${escapeHtml(text.split(' ')[1])}</rt><rp>)</rp></ruby>`;
						} else {
							const rt = node.children.at(-1);

							if (!rt) {
								return fnDefault(node);
							}

							const text = rt.type === 'text' ? rt.props.text : '';

							// ruby未対応のHTMLサニタイザーを通したときにルビが「対象テキスト（ルビテキスト）」にフォールバックするようにする
							return `<ruby>${toHtml(node.children.slice(0, node.children.length - 1))}<rp>(</rp><rt>${escapeHtml(text.trim())}</rt><rp>)</rp></ruby>`;
						}
					}

					default: {
						return fnDefault(node);
					}
				}
			},

			blockCode: (node) => {
				return `<pre><code>${escapeHtml(node.props.code)}</code></pre>`;
			},

			center: (node) => {
				return `<div style="text-align: center;">${toHtml(node.children)}</div>`;
			},

			emojiCode: (node) => {
				return `\u200B:${escapeHtml(node.props.name)}:\u200B`;
			},

			unicodeEmoji: (node) => {
				return node.props.emoji;
			},

			hashtag: (node) => {
				return `<a href="${escapeHtml(`${this.config.url}/tags/${encodeURIComponent(node.props.hashtag)}`)}" rel="tag">#${escapeHtml(node.props.hashtag)}</a>`;
			},

			inlineCode: (node) => {
				return `<code>${escapeHtml(node.props.code)}</code>`;
			},

			mathInline: (node) => {
				return `<code>${escapeHtml(node.props.formula)}</code>`;
			},

			mathBlock: (node) => {
				return `<pre><code>${escapeHtml(node.props.formula)}</code></pre>`;
			},

			link: (node) => {
				try {
					const url = new URL(node.props.url);
					return `<a href="${escapeHtml(url.href)}">${toHtml(node.children)}</a>`;
				} catch (err) {
					return `[${toHtml(node.children)}](${escapeHtml(node.props.url)})`;
				}
			},

			mention: (node) => {
				const { username, host, acct } = node.props;
				const remoteUserInfo = mentionedRemoteUsers.find(remoteUser => remoteUser.username.toLowerCase() === username.toLowerCase() && remoteUser.host?.toLowerCase() === host?.toLowerCase());
				const href = remoteUserInfo
					? (remoteUserInfo.url ? remoteUserInfo.url : remoteUserInfo.uri)
					: `${this.config.url}/${acct.endsWith(`@${this.config.url}`) ? acct.substring(0, acct.length - this.config.url.length - 1) : acct}`;
				try {
					const url = new URL(href);
					return `<a href="${escapeHtml(url.href)}" class="u-url mention">${escapeHtml(acct)}</a>`;
				} catch (err) {
					return escapeHtml(acct);
				}
			},

			quote: (node) => {
				return `<blockquote>${toHtml(node.children)}</blockquote>`;
			},

			text: (node) => {
				if (!node.props.text.match(/[\r\n]/)) {
					return escapeHtml(node.props.text);
				}

				let html = '';

				const lines = node.props.text.split(/\r\n|\r|\n/).map(x => escapeHtml(x));

				for (const x of intersperse<FIXME | 'br'>('br', lines)) {
					html += x === 'br' ? '<br />' : x;
				}

				return html;
			},

			url: (node) => {
				try {
					const url = new URL(node.props.url);
					return `<a href="${escapeHtml(url.href)}">${escapeHtml(node.props.url)}</a>`;
				} catch (err) {
					return escapeHtml(node.props.url);
				}
			},

			search: (node) => {
				return `<a href="${escapeHtml(`https://www.google.com/search?q=${encodeURIComponent(node.props.query)}`)}">${escapeHtml(node.props.content)}</a>`;
			},

			plain: (node) => {
				return `<span>${toHtml(node.children)}</span>`;
			},
		} satisfies { [K in mfm.MfmNode['type']]: (node: mfm.NodeType<K>) => string } as { [K in mfm.MfmNode['type']]: (node: mfm.MfmNode) => string };

		return `${toHtml(nodes)}${extraHtml ?? ''}`;
	}
}
