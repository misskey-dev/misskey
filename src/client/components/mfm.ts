import Vue, { VNode } from 'vue';
import { MfmForest } from '../../mfm/prelude';
import { parse, parsePlain } from '../../mfm/parse';
import MkUrl from './url.vue';
import MkMention from './mention.vue';
import { concat } from '../../prelude/array';
import { host } from '../config';

export default Vue.component('misskey-flavored-markdown', {
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
		colored: {
			type: Boolean,
			default: true
		},
	},

	render(createElement) {
		if (this.text == null || this.text == '') return;

		const ast = (this.plain ? parsePlain : parse)(this.text);

		const genEl = (ast: MfmForest) => concat(ast.map((token): VNode[] => {
			switch (token.node.type) {
				case 'text': {
					const text = token.node.props.text.replace(/(\r\n|\n|\r)/g, '\n');

					if (!this.plain) {
						const x = text.split('\n')
							.map(t => t == '' ? [createElement('br')] : [createElement('span', t), createElement('br')]);
						x[x.length - 1].pop();
						return x;
					} else {
						return [createElement('span', text.replace(/\n/g, ' '))];
					}
				}

				case 'bold': {
					return [createElement('b', genEl(token.children))];
				}

				case 'strike': {
					return [createElement('del', genEl(token.children))];
				}

				case 'italic': {
					return (createElement as any)('i', {
						attrs: {
							style: 'font-style: oblique;'
						},
					}, genEl(token.children));
				}

				case 'small': {
					return [createElement('small', {
						attrs: {
							style: 'opacity: 0.7;'
						},
					}, genEl(token.children))];
				}

				case 'url': {
					return [createElement(MkUrl, {
						key: Math.random(),
						props: {
							url: token.node.props.url,
							rel: 'nofollow noopener',
						},
						attrs: this.colored ? {
							style: 'color:var(--link);'
						} : {}
					})];
				}

				case 'link': {
					return [createElement('a', {
						attrs: {
							class: 'link',
							href: token.node.props.url,
							rel: 'nofollow noopener',
							target: '_blank',
							title: token.node.props.url,
							style: this.colored ? 'color:var(--link);' : ''
						}
					}, genEl(token.children))];
				}

				case 'mention': {
					return [createElement(MkMention, {
						key: Math.random(),
						props: {
							host: (token.node.props.host == null && this.author && this.author.host != null ? this.author.host : token.node.props.host) || host,
							username: token.node.props.username
						},
						attrs: {
							style: this.colored ? 'color:var(--mention);' : ''
						}
					})];
				}

				case 'hashtag': {
					return [createElement('router-link', {
						key: Math.random(),
						attrs: {
							to: this.isNote ? `/tags/${encodeURIComponent(token.node.props.hashtag)}` : `/explore/tags/${encodeURIComponent(token.node.props.hashtag)}`,
							style: this.colored ? 'color:var(--hashtag);' : ''
						}
					}, `#${token.node.props.hashtag}`)];
				}

				case 'quote': {
					if (this.shouldBreak) {
						return [createElement('div', {
							attrs: {
								class: 'quote'
							}
						}, genEl(token.children))];
					} else {
						return [createElement('span', {
							attrs: {
								class: 'quote'
							}
						}, genEl(token.children))];
					}
				}

				case 'title': {
					return [createElement('div', {
						attrs: {
							class: 'title'
						}
					}, genEl(token.children))];
				}

				case 'emoji': {
					const customEmojis = (this.$root.getMetaSync() || { emojis: [] }).emojis || [];
					return [createElement('mk-emoji', {
						key: Math.random(),
						attrs: {
							emoji: token.node.props.emoji,
							name: token.node.props.name
						},
						props: {
							customEmojis: this.customEmojis || customEmojis,
							normal: this.plain
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
		return createElement('span', genEl(ast));
	}
});
