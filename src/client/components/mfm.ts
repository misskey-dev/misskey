import { VNode, defineComponent, h } from 'vue';
import { MfmForest } from '@/../mfm/prelude';
import { parse, parsePlain } from '@/../mfm/parse';
import MkUrl from '@/components/global/url.vue';
import MkLink from '@/components/link.vue';
import MkMention from '@/components/mention.vue';
import MkEmoji from '@/components/global/emoji.vue';
import { concat } from '@/../prelude/array';
import MkFormula from '@/components/formula.vue';
import MkCode from '@/components/code.vue';
import MkGoogle from '@/components/google.vue';
import MkA from '@/components/global/a.vue';
import { host } from '@/config';

export default defineComponent({
	props: {
		text: {
			type: String,
			required: true
		},
		plain: {
			type: Boolean,
			default: false
		},
		nowrap: {
			type: Boolean,
			default: false
		},
		author: {
			type: Object,
			default: null
		},
		i: {
			type: Object,
			default: null
		},
		customEmojis: {
			required: false,
		},
		isNote: {
			type: Boolean,
			default: true
		},
	},

	render() {
		if (this.text == null || this.text == '') return;

		const ast = (this.plain ? parsePlain : parse)(this.text);

		const validTime = (t: string | null | undefined) => {
			if (t == null) return null;
			return t.match(/^[0-9.]+s$/) ? t : null;
		};

		const genEl = (ast: MfmForest) => concat(ast.map((token): VNode[] => {
			switch (token.node.type) {
				case 'text': {
					const text = token.node.props.text.replace(/(\r\n|\n|\r)/g, '\n');

					if (!this.plain) {
						const x = text.split('\n')
							.map(t => t == '' ? [h('br')] : [t, h('br')]);
						x[x.length - 1].pop();
						return x;
					} else {
						return [text.replace(/\n/g, ' ')];
					}
				}

				case 'bold': {
					return [h('b', genEl(token.children))];
				}

				case 'strike': {
					return [h('del', genEl(token.children))];
				}

				case 'italic': {
					return h('i', {
						style: 'font-style: oblique;'
					}, genEl(token.children));
				}

				case 'fn': {
					// TODO: CSSを文字列で組み立てていくと token.node.props.args.~~~ 経由でCSSインジェクションできるのでよしなにやる
					let style;
					switch (token.node.props.name) {
						case 'tada': {
							style = `font-size: 150%;` + (this.$store.state.animatedMfm ? 'animation: tada 1s linear infinite both;' : '');
							break;
						}
						case 'jelly': {
							const speed = validTime(token.node.props.args.speed) || '1s';
							style = (this.$store.state.animatedMfm ? `animation: mfm-rubberBand ${speed} linear infinite both;` : '');
							break;
						}
						case 'twitch': {
							const speed = validTime(token.node.props.args.speed) || '0.5s';
							style = this.$store.state.animatedMfm ? `animation: mfm-twitch ${speed} ease infinite;` : '';
							break;
						}
						case 'shake': {
							const speed = validTime(token.node.props.args.speed) || '0.5s';
							style = this.$store.state.animatedMfm ? `animation: mfm-shake ${speed} ease infinite;` : '';
							break;
						}
						case 'spin': {
							const direction =
								token.node.props.args.left ? 'reverse' :
								token.node.props.args.alternate ? 'alternate' :
								'normal';
							const anime =
								token.node.props.args.x ? 'mfm-spinX' :
								token.node.props.args.y ? 'mfm-spinY' :
								'mfm-spin';
							const speed = validTime(token.node.props.args.speed) || '1.5s';
							style = this.$store.state.animatedMfm ? `animation: ${anime} ${speed} linear infinite; animation-direction: ${direction};` : '';
							break;
						}
						case 'jump': {
							style = this.$store.state.animatedMfm ? 'animation: mfm-jump 0.75s linear infinite;' : '';
							break;
						}
						case 'bounce': {
							style = this.$store.state.animatedMfm ? 'animation: mfm-bounce 0.75s linear infinite; transform-origin: center bottom;' : '';
							break;
						}
						case 'flip': {
							const transform =
								(token.node.props.args.h && token.node.props.args.v) ? 'scale(-1, -1)' :
								token.node.props.args.v ? 'scaleY(-1)' :
								'scaleX(-1)';
							style = `transform: ${transform};`;
							break;
						}
						case 'x2': {
							style = `font-size: 200%;`;
							break;
						}
						case 'x3': {
							style = `font-size: 400%;`;
							break;
						}
						case 'x4': {
							style = `font-size: 600%;`;
							break;
						}
						case 'font': {
							const family =
								token.node.props.args.serif ? 'serif' :
								token.node.props.args.monospace ? 'monospace' :
								token.node.props.args.cursive ? 'cursive' :
								token.node.props.args.fantasy ? 'fantasy' :
								token.node.props.args.emoji ? 'emoji' :
								token.node.props.args.math ? 'math' :
								null;
							if (family) style = `font-family: ${family};`;
							break;
						}
						case 'blur': {
							return h('span', {
								class: '_mfm_blur_',
							}, genEl(token.children));
						}
					}
					if (style == null) {
						return h('span', {}, ['[', token.node.props.name, ...genEl(token.children), ']']);
					} else {
						return h('span', {
							style: 'display: inline-block;' + style,
						}, genEl(token.children));
					}
				}

				case 'small': {
					return [h('small', {
						style: 'opacity: 0.7;'
					}, genEl(token.children))];
				}

				case 'center': {
					return [h('div', {
						style: 'text-align:center;'
					}, genEl(token.children))];
				}

				case 'url': {
					return [h(MkUrl, {
						key: Math.random(),
						url: token.node.props.url,
						rel: 'nofollow noopener',
					})];
				}

				case 'link': {
					return [h(MkLink, {
						key: Math.random(),
						url: token.node.props.url,
						rel: 'nofollow noopener',
					}, genEl(token.children))];
				}

				case 'mention': {
					return [h(MkMention, {
						key: Math.random(),
						host: (token.node.props.host == null && this.author && this.author.host != null ? this.author.host : token.node.props.host) || host,
						username: token.node.props.username
					})];
				}

				case 'hashtag': {
					return [h(MkA, {
						key: Math.random(),
						to: this.isNote ? `/tags/${encodeURIComponent(token.node.props.hashtag)}` : `/explore/tags/${encodeURIComponent(token.node.props.hashtag)}`,
						style: 'color:var(--hashtag);'
					}, `#${token.node.props.hashtag}`)];
				}

				case 'blockCode': {
					return [h(MkCode, {
						key: Math.random(),
						code: token.node.props.code,
						lang: token.node.props.lang,
					})];
				}

				case 'inlineCode': {
					return [h(MkCode, {
						key: Math.random(),
						code: token.node.props.code,
						lang: token.node.props.lang,
						inline: true
					})];
				}

				case 'quote': {
					if (!this.nowrap) {
						return [h('div', {
							class: 'quote'
						}, genEl(token.children))];
					} else {
						return [h('span', {
							class: 'quote'
						}, genEl(token.children))];
					}
				}

				case 'emoji': {
					return [h(MkEmoji, {
						key: Math.random(),
						emoji: token.node.props.name ? `:${token.node.props.name}:` : token.node.props.emoji,
						customEmojis: this.customEmojis,
						normal: this.plain
					})];
				}

				case 'mathInline': {
					return [h(MkFormula, {
						key: Math.random(),
						formula: token.node.props.formula,
						block: false
					})];
				}

				case 'mathBlock': {
					return [h(MkFormula, {
						key: Math.random(),
						formula: token.node.props.formula,
						block: true
					})];
				}

				case 'search': {
					return [h(MkGoogle, {
						key: Math.random(),
						q: token.node.props.query
					})];
				}

				default: {
					console.error('unrecognized ast type:', token.node.type);

					return [];
				}
			}
		}));

		// Parse ast to DOM
		return h('span', genEl(ast));
	}
});
