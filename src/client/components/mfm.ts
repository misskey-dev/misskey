import { VNode, defineComponent, h } from 'vue';
import { MfmForest } from '../../mfm/prelude';
import { parse, parsePlain } from '../../mfm/parse';
import MkUrl from './url.vue';
import MkLink from './link.vue';
import MkMention from './mention.vue';
import { concat } from '../../prelude/array';
import MkFormula from './formula.vue';
import MkCode from './code.vue';
import MkGoogle from './google.vue';
import { host } from '../config';

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

		const genEl = (ast: MfmForest) => concat(ast.map((token): VNode[] => {
			switch (token.node.type) {
				case 'text': {
					const text = token.node.props.text.replace(/(\r\n|\n|\r)/g, '\n');

					if (!this.plain) {
						const x = text.split('\n')
							.map(t => t == '' ? [h('br')] : [this._v(t), h('br')]); // NOTE: this._vはHACK SEE: https://github.com/syuilo/misskey/pull/6399#issuecomment-632820283
						x[x.length - 1].pop();
						return x;
					} else {
						return [this._v(text.replace(/\n/g, ' '))];
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
						attrs: {
							style: 'font-style: oblique;'
						},
					}, genEl(token.children));
				}

				case 'big': {
					return h('strong', {
						attrs: {
							style: `display: inline-block; font-size: 150%;`
						},
						directives: [this.$store.state.device.animatedMfm ? {
							name: 'animate-css',
							value: { classes: 'tada', iteration: 'infinite' }
						}: {}]
					}, genEl(token.children));
				}

				case 'small': {
					return [h('small', {
						attrs: {
							style: 'opacity: 0.7;'
						},
					}, genEl(token.children))];
				}

				case 'center': {
					return [h('div', {
						attrs: {
							style: 'text-align:center;'
						}
					}, genEl(token.children))];
				}

				case 'motion': {
					return h('span', {
						attrs: {
							style: 'display: inline-block;'
						},
						directives: [this.$store.state.device.animatedMfm ? {
							name: 'animate-css',
							value: { classes: 'rubberBand', iteration: 'infinite' }
						} : {}]
					}, genEl(token.children));
				}

				case 'spin': {
					const direction =
						token.node.props.attr == 'left' ? 'reverse' :
						token.node.props.attr == 'alternate' ? 'alternate' :
						'normal';
					const style = this.$store.state.device.animatedMfm
						? `animation: spin 1.5s linear infinite; animation-direction: ${direction};` : '';
					return h('span', {
						attrs: {
							style: 'display: inline-block;' + style
						},
					}, genEl(token.children));
				}

				case 'jump': {
					return h('span', {
						attrs: {
							style: this.$store.state.device.animatedMfm ? 'display: inline-block; animation: jump 0.75s linear infinite;' : 'display: inline-block;'
						},
					}, genEl(token.children));
				}

				case 'flip': {
					return h('span', {
						attrs: {
							style: 'display: inline-block; transform: scaleX(-1);'
						},
					}, genEl(token.children));
				}

				case 'url': {
					return [h(MkUrl, {
						key: Math.random(),
						props: {
							url: token.node.props.url,
							rel: 'nofollow noopener',
						},
					})];
				}

				case 'link': {
					return [h(MkLink, {
						key: Math.random(),
						props: {
							url: token.node.props.url,
							rel: 'nofollow noopener',
						},
					}, genEl(token.children))];
				}

				case 'mention': {
					return [h(MkMention, {
						key: Math.random(),
						props: {
							host: (token.node.props.host == null && this.author && this.author.host != null ? this.author.host : token.node.props.host) || host,
							username: token.node.props.username
						}
					})];
				}

				case 'hashtag': {
					return [h('router-link', {
						key: Math.random(),
						attrs: {
							to: this.isNote ? `/tags/${encodeURIComponent(token.node.props.hashtag)}` : `/explore/tags/${encodeURIComponent(token.node.props.hashtag)}`,
							style: 'color:var(--hashtag);'
						}
					}, `#${token.node.props.hashtag}`)];
				}

				case 'blockCode': {
					return [h(MkCode, {
						key: Math.random(),
						props: {
							code: token.node.props.code,
							lang: token.node.props.lang,
						}
					})];
				}

				case 'inlineCode': {
					return [h(MkCode, {
						key: Math.random(),
						props: {
							code: token.node.props.code,
							lang: token.node.props.lang,
							inline: true
						}
					})];
				}

				case 'quote': {
					if (this.shouldBreak) {
						return [h('div', {
							attrs: {
								class: 'quote'
							}
						}, genEl(token.children))];
					} else {
						return [h('span', {
							attrs: {
								class: 'quote'
							}
						}, genEl(token.children))];
					}
				}

				case 'title': {
					return [h('div', {
						attrs: {
							class: 'title'
						}
					}, genEl(token.children))];
				}

				case 'emoji': {
					return [h('mk-emoji', {
						key: Math.random(),
						attrs: {
							emoji: token.node.props.emoji,
							name: token.node.props.name
						},
						props: {
							customEmojis: this.customEmojis,
							normal: this.plain
						}
					})];
				}

				case 'mathInline': {
					return [h(MkFormula, {
						key: Math.random(),
						props: {
							formula: token.node.props.formula,
							block: false
						}
					})];
				}

				case 'mathBlock': {
					return [h(MkFormula, {
						key: Math.random(),
						props: {
							formula: token.node.props.formula,
							block: true
						}
					})];
				}

				case 'search': {
					return [h(MkGoogle, {
						key: Math.random(),
						props: {
							q: token.node.props.query
						}
					})];
				}

				default: {
					console.log('unknown ast type:', token.node.type);

					return [];
				}
			}
		}));

		// Parse ast to DOM
		return h('span', genEl(ast));
	}
});
