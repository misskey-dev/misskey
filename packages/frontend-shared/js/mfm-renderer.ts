/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { h } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { host } from './config.js';
import type { Component, VNode, SetupContext } from 'vue';

function safeParseFloat(str: unknown): number | null {
	if (typeof str !== 'string' || str === '') return null;
	const num = parseFloat(str);
	if (isNaN(num)) return null;
	return num;
}

const QUOTE_STYLE = `
display: block;
margin: 8px;
padding: 6px 0 6px 12px;
color: var(--MI_THEME-fg);
border-left: solid 3px var(--MI_THEME-fg);
opacity: 0.7;
`.split('\n').join(' ');

export type MfmBaseProps = {
	text: string;
	plain?: boolean;
	nowrap?: boolean;
	author?: Misskey.entities.UserLite;
	isNote?: boolean;
	emojiUrls?: Record<string, string>;
	rootScale?: number;
	nyaize?: boolean | 'respect';
	parsedNodes?: mfm.MfmNode[] | null;
};

/** `supports` で有効にした場合のみ参照される props */
type MfmOptionalProps = {
	enableEmojiMenu?: boolean;
	enableEmojiMenuReaction?: boolean;
	linkNavigationBehavior?: unknown;
};

export type MfmEvents = {
	clickEv(id: string): void;
};

export type MfmRendererConfig = {
	/**
	 * 描画時に呼ばれる
	 * 循環インポートを防ぐために、単純なkey-valueではなく関数を採用
	 */
	components: () => {
		Url: Component;
		Link: Component;
		Mention: Component;
		A: Component;
		Time: Component;
		Emoji: Component;
		CustomEmoji: Component;
		/** 省略時は `<code>` で描画する */
		Code?: Component;
		/** 省略時は `<code>` で描画する */
		CodeInline?: Component;
		/** 省略時は検索語をそのまま描画する */
		Search?: Component;
		/** 省略時は sparkle を無視して子要素のみ描画する */
		Sparkle?: Component;
	};
	/** 描画のたびに呼ばれる (設定の変更をリアクティブに反映するため) 。省略時はすべて有効 */
	getOptions?: () => {
		advancedMfm: boolean;
		animatedMfm: boolean;
	};
	/** 子コンポーネントが対応している追加の props */
	supports?: {
		/** Url / Link / Mention の `navigationBehavior` 、A の `behavior` */
		navigationBehavior?: boolean;
		/** Emoji / CustomEmoji の `menu` / `menuReaction` */
		emojiMenu?: boolean;
	};
};

export function createMfmRenderer<P extends MfmBaseProps = MfmBaseProps>(config: MfmRendererConfig) {
	const supportsNavigationBehavior = config.supports?.navigationBehavior ?? false;
	const supportsEmojiMenu = config.supports?.emojiMenu ?? false;

	return function (_props: P, { emit }: { emit: SetupContext<MfmEvents>['emit'] }) {
		// こうしたいところだけど functional component 内では provide は使えない
		//provide('linkNavigationBehavior', props.linkNavigationBehavior);

		const props = _props as P & MfmOptionalProps;
		const { Url, Link, Mention, A, Time, Emoji, CustomEmoji, Code, CodeInline, Search, Sparkle } = config.components();

		const isNote = props.isNote ?? true;
		const shouldNyaize = props.nyaize ? props.nyaize === 'respect' ? props.author?.isCat : false : false;

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (props.text == null || props.text === '') return;

		const rootAst = props.parsedNodes ?? (props.plain ? mfm.parseSimple : mfm.parse)(props.text);

		const validTime = (t: string | boolean | null | undefined) => {
			if (t == null) return null;
			if (typeof t === 'boolean') return null;
			return t.match(/^\-?[0-9.]+s$/) ? t : null;
		};

		const validColor = (c: unknown): string | null => {
			if (typeof c !== 'string') return null;
			return c.match(/^[0-9a-f]{3,6}$/i) ? c : null;
		};

		const { advancedMfm, animatedMfm } = config.getOptions?.() ?? { advancedMfm: true, animatedMfm: true };
		const useAnim = advancedMfm && animatedMfm;

		const linkProps = supportsNavigationBehavior ? { navigationBehavior: props.linkNavigationBehavior } : {};
		const hashtagProps = supportsNavigationBehavior ? { behavior: props.linkNavigationBehavior } : {};
		const emojiMenuProps = supportsEmojiMenu ? { menu: props.enableEmojiMenu, menuReaction: props.enableEmojiMenuReaction } : {};

		/**
		 * Gen Vue Elements from MFM AST
		 * @param ast MFM AST
		 * @param scale How times large the text is
		 * @param disableNyaize Whether nyaize is disabled or not
		 */
		const genEl = (ast: mfm.MfmNode[], scale: number, disableNyaize = false) => ast.map((token): VNode | string | (VNode | string)[] => {
			switch (token.type) {
				case 'text': {
					let text = token.props.text.replace(/(\r\n|\n|\r)/g, '\n');
					if (!disableNyaize && shouldNyaize) {
						text = Misskey.nyaize(text);
					}

					if (!props.plain) {
						const res: (VNode | string)[] = [];
						for (const t of text.split('\n')) {
							res.push(h('br'));
							res.push(t);
						}
						res.shift();
						return res;
					} else {
						return [text.replace(/\n/g, ' ')];
					}
				}

				case 'bold': {
					return [h('b', genEl(token.children, scale))];
				}

				case 'strike': {
					return [h('del', genEl(token.children, scale))];
				}

				case 'italic': {
					return h('i', {
						style: 'font-style: oblique;',
					}, genEl(token.children, scale));
				}

				case 'fn': {
					// TODO: CSSを文字列で組み立てていくと token.props.args.~~~ 経由でCSSインジェクションできるのでよしなにやる
					let style: string | undefined;
					switch (token.props.name) {
						case 'tada': {
							const speed = validTime(token.props.args.speed) ?? '1s';
							const delay = validTime(token.props.args.delay) ?? '0s';
							style = 'font-size: 150%;' + (useAnim ? `animation: global-tada ${speed} linear infinite both; animation-delay: ${delay};` : '');
							break;
						}
						case 'jelly': {
							const speed = validTime(token.props.args.speed) ?? '1s';
							const delay = validTime(token.props.args.delay) ?? '0s';
							style = (useAnim ? `animation: mfm-rubberBand ${speed} linear infinite both; animation-delay: ${delay};` : '');
							break;
						}
						case 'twitch': {
							const speed = validTime(token.props.args.speed) ?? '0.5s';
							const delay = validTime(token.props.args.delay) ?? '0s';
							style = useAnim ? `animation: mfm-twitch ${speed} ease infinite; animation-delay: ${delay};` : '';
							break;
						}
						case 'shake': {
							const speed = validTime(token.props.args.speed) ?? '0.5s';
							const delay = validTime(token.props.args.delay) ?? '0s';
							style = useAnim ? `animation: mfm-shake ${speed} ease infinite; animation-delay: ${delay};` : '';
							break;
						}
						case 'spin': {
							const direction =
								token.props.args.left ? 'reverse' :
								token.props.args.alternate ? 'alternate' :
								'normal';
							const anime =
								token.props.args.x ? 'mfm-spinX' :
								token.props.args.y ? 'mfm-spinY' :
								'mfm-spin';
							const speed = validTime(token.props.args.speed) ?? '1.5s';
							const delay = validTime(token.props.args.delay) ?? '0s';
							style = useAnim ? `animation: ${anime} ${speed} linear infinite; animation-direction: ${direction}; animation-delay: ${delay};` : '';
							break;
						}
						case 'jump': {
							const speed = validTime(token.props.args.speed) ?? '0.75s';
							const delay = validTime(token.props.args.delay) ?? '0s';
							style = useAnim ? `animation: mfm-jump ${speed} linear infinite; animation-delay: ${delay};` : '';
							break;
						}
						case 'bounce': {
							const speed = validTime(token.props.args.speed) ?? '0.75s';
							const delay = validTime(token.props.args.delay) ?? '0s';
							style = useAnim ? `animation: mfm-bounce ${speed} linear infinite; transform-origin: center bottom; animation-delay: ${delay};` : '';
							break;
						}
						case 'flip': {
							const transform =
								(token.props.args.h && token.props.args.v) ? 'scale(-1, -1)' :
								token.props.args.v ? 'scaleY(-1)' :
								'scaleX(-1)';
							style = `transform: ${transform};`;
							break;
						}
						case 'x2': {
							return h('span', {
								class: advancedMfm ? 'mfm-x2' : '',
							}, genEl(token.children, scale * 2));
						}
						case 'x3': {
							return h('span', {
								class: advancedMfm ? 'mfm-x3' : '',
							}, genEl(token.children, scale * 3));
						}
						case 'x4': {
							return h('span', {
								class: advancedMfm ? 'mfm-x4' : '',
							}, genEl(token.children, scale * 4));
						}
						case 'font': {
							const family =
								token.props.args.serif ? 'serif' :
								token.props.args.monospace ? 'monospace' :
								token.props.args.cursive ? 'cursive' :
								token.props.args.fantasy ? 'fantasy' :
								token.props.args.emoji ? 'emoji' :
								token.props.args.math ? 'math' :
								null;
							if (family) style = `font-family: ${family};`;
							break;
						}
						case 'blur': {
							return h('span', {
								class: '_mfm_blur_',
							}, genEl(token.children, scale));
						}
						case 'rainbow': {
							if (!useAnim) {
								return h('span', {
									class: '_mfm_rainbow_fallback_',
								}, genEl(token.children, scale));
							}
							const speed = validTime(token.props.args.speed) ?? '1s';
							const delay = validTime(token.props.args.delay) ?? '0s';
							style = `animation: mfm-rainbow ${speed} linear infinite; animation-delay: ${delay};`;
							break;
						}
						case 'sparkle': {
							if (!useAnim || Sparkle == null) {
								return genEl(token.children, scale);
							}
							// スロット関数の中で genEl を呼ぶと Sparkle が再描画されるたびに子の VNode が作り直される
							const sparkleChildren = genEl(token.children, scale);
							return h(Sparkle, {}, { default: () => sparkleChildren });
						}
						case 'rotate': {
							const degrees = safeParseFloat(token.props.args.deg) ?? 90;
							style = `transform: rotate(${degrees}deg); transform-origin: center center;`;
							break;
						}
						case 'position': {
							if (!advancedMfm) break;
							const x = safeParseFloat(token.props.args.x) ?? 0;
							const y = safeParseFloat(token.props.args.y) ?? 0;
							style = `transform: translateX(${x}em) translateY(${y}em);`;
							break;
						}
						case 'scale': {
							if (!advancedMfm) {
								style = '';
								break;
							}
							const x = Math.min(safeParseFloat(token.props.args.x) ?? 1, 5);
							const y = Math.min(safeParseFloat(token.props.args.y) ?? 1, 5);
							style = `transform: scale(${x}, ${y});`;
							scale = scale * Math.max(x, y);
							break;
						}
						case 'fg': {
							let color = validColor(token.props.args.color);
							color = color ?? 'f00';
							style = `color: #${color}; overflow-wrap: anywhere;`;
							break;
						}
						case 'bg': {
							let color = validColor(token.props.args.color);
							color = color ?? 'f00';
							style = `background-color: #${color}; overflow-wrap: anywhere;`;
							break;
						}
						case 'border': {
							let color = validColor(token.props.args.color);
							color = color ? `#${color}` : 'var(--MI_THEME-accent)';
							let b_style = token.props.args.style;
							if (
								typeof b_style !== 'string' ||
								!['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']
									.includes(b_style)
							) b_style = 'solid';
							const width = safeParseFloat(token.props.args.width) ?? 1;
							const radius = safeParseFloat(token.props.args.radius) ?? 0;
							style = `border: ${width}px ${b_style} ${color}; border-radius: ${radius}px;${token.props.args.noclip ? '' : ' overflow: clip;'}`;
							break;
						}
						case 'ruby': {
							if (token.children.length === 1) {
								const child = token.children[0];
								let text = child.type === 'text' ? child.props.text : '';
								if (!disableNyaize && shouldNyaize) {
									text = Misskey.nyaize(text);
								}
								return h('ruby', {}, [text.split(' ')[0], h('rt', text.split(' ')[1])]);
							} else {
								const rt = token.children.at(-1)!;
								let text = rt.type === 'text' ? rt.props.text : '';
								if (!disableNyaize && shouldNyaize) {
									text = Misskey.nyaize(text);
								}
								return h('ruby', {}, [...genEl(token.children.slice(0, token.children.length - 1), scale), h('rt', text.trim())]);
							}
						}
						case 'unixtime': {
							const child = token.children[0];
							const unixtime = parseInt(child.type === 'text' ? child.props.text : '');
							return h('span', {
								style: 'display: inline-block; font-size: 90%; border: solid 1px var(--MI_THEME-divider); border-radius: 999px; padding: 4px 10px 4px 6px;',
							}, [
								h('i', {
									class: 'ti ti-clock',
									style: 'margin-right: 0.25em;',
								}),
								h(Time, {
									key: Math.random(),
									time: unixtime * 1000,
									mode: 'detail',
								}),
							]);
						}
						case 'clickable': {
							return h('span', {
								style: 'user-select: none;',
								onClick(ev: PointerEvent): void {
									ev.stopPropagation();
									ev.preventDefault();
									const clickEv = typeof token.props.args.ev === 'string' ? token.props.args.ev : '';
									emit('clickEv', clickEv);
								},
							}, genEl(token.children, scale));
						}
					}
					if (style === undefined) {
						return h('span', {}, ['$[', token.props.name, ' ', ...genEl(token.children, scale), ']']);
					} else {
						return h('span', {
							style: 'display: inline-block; ' + style,
						}, genEl(token.children, scale));
					}
				}

				case 'small': {
					return [h('small', {
						style: 'opacity: 0.7;',
					}, genEl(token.children, scale))];
				}

				case 'center': {
					return [h('div', {
						style: 'text-align:center;',
					}, genEl(token.children, scale))];
				}

				case 'url': {
					return [h(Url, {
						key: Math.random(),
						url: token.props.url,
						rel: 'nofollow noopener',
						...linkProps,
					})];
				}

				case 'link': {
					// スロット関数の中で genEl を呼ぶと再描画されるたびに子の VNode が作り直される
					const linkChildren = genEl(token.children, scale, true);
					return [h(Link, {
						key: Math.random(),
						url: token.props.url,
						rel: 'nofollow noopener',
						...linkProps,
					}, { default: () => linkChildren })];
				}

				case 'mention': {
					return [h(Mention, {
						key: Math.random(),
						host: (token.props.host == null && props.author && props.author.host != null ? props.author.host : token.props.host) ?? host,
						username: token.props.username,
						...linkProps,
					})];
				}

				case 'hashtag': {
					return [h(A, {
						key: Math.random(),
						to: isNote ? `/tags/${encodeURIComponent(token.props.hashtag)}` : `/user-tags/${encodeURIComponent(token.props.hashtag)}`,
						style: 'color:var(--MI_THEME-hashtag);',
						...hashtagProps,
					}, { default: () => `#${token.props.hashtag}` })];
				}

				case 'blockCode': {
					if (Code == null) {
						return [h('code', {
							key: Math.random(),
							lang: token.props.lang ?? undefined,
						}, token.props.code)];
					}
					return [h(Code, {
						key: Math.random(),
						code: token.props.code,
						lang: token.props.lang ?? undefined,
					})];
				}

				case 'inlineCode': {
					if (CodeInline == null) {
						return [h('code', {
							key: Math.random(),
						}, token.props.code)];
					}
					return [h(CodeInline, {
						key: Math.random(),
						code: token.props.code,
					})];
				}

				case 'quote': {
					if (!props.nowrap) {
						return [h('div', {
							style: QUOTE_STYLE,
						}, genEl(token.children, scale, true))];
					} else {
						return [h('span', {
							style: QUOTE_STYLE,
						}, genEl(token.children, scale, true))];
					}
				}

				case 'emojiCode': {
					if (props.author?.host == null) {
						return [h(CustomEmoji, {
							key: Math.random(),
							name: token.props.name,
							normal: props.plain,
							host: null,
							useOriginalSize: scale >= 2.5,
							...emojiMenuProps,
							fallbackToImage: false,
						})];
					} else {
						// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
						if (props.emojiUrls && (props.emojiUrls[token.props.name] == null)) {
							return [h('span', `:${token.props.name}:`)];
						} else {
							return [h(CustomEmoji, {
								key: Math.random(),
								name: token.props.name,
								url: props.emojiUrls && props.emojiUrls[token.props.name],
								normal: props.plain,
								host: props.author.host,
								useOriginalSize: scale >= 2.5,
								// リモートの絵文字はリアクションできないので menuReaction は常に false
								...(supportsEmojiMenu ? { menu: props.enableEmojiMenu, menuReaction: false } : {}),
							})];
						}
					}
				}

				case 'unicodeEmoji': {
					return [h(Emoji, {
						key: Math.random(),
						emoji: token.props.emoji,
						...emojiMenuProps,
					})];
				}

				case 'mathInline': {
					return [h('code', token.props.formula)];
				}

				case 'mathBlock': {
					return [h('code', token.props.formula)];
				}

				case 'search': {
					if (Search == null) {
						return [h('div', {
							key: Math.random(),
						}, token.props.query)];
					}
					return [h(Search, {
						key: Math.random(),
						q: token.props.query,
					})];
				}

				case 'plain': {
					return [h('span', genEl(token.children, scale, true))];
				}

				default: {
					// @ts-expect-error 存在しないASTタイプ
					console.error('unrecognized ast type:', token.type);

					return [];
				}
			}
		}).flat(Infinity) as (VNode | string)[];

		return h('span', {
			// https://codeday.me/jp/qa/20190424/690106.html
			style: props.nowrap ? 'white-space: pre; word-wrap: normal; overflow: hidden; text-overflow: ellipsis;' : 'white-space: pre-wrap;',
		}, genEl(rootAst, props.rootScale ?? 1));
	};
}
