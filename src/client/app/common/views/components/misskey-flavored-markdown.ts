import Vue from 'vue';
import * as emojilib from 'emojilib';
import { length } from 'stringz';
import parse from '../../../../../mfm/parse';
import getAcct from '../../../../../misc/acct/render';
import { url } from '../../../config';
import MkUrl from './url.vue';
import MkGoogle from './google.vue';

const flatten = list => list.reduce(
	(a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

export default Vue.component('misskey-flavored-markdown', {
	props: {
		text: {
			type: String,
			required: true
		},
		ast: {
			type: [],
			required: false
		},
		shouldBreak: {
			type: Boolean,
			default: true
		},
		i: {
			type: Object,
			default: null
		}
	},

	render(createElement) {
		let ast;

		if (this.ast == null) {
			// Parse text to ast
			ast = parse(this.text);
		} else {
			ast = this.ast;
		}

		let bigCount = 0;
		let motionCount = 0;

		// Parse ast to DOM
		const els = flatten(ast.map(token => {
			switch (token.type) {
				case 'text': {
					const text = token.content.replace(/(\r\n|\n|\r)/g, '\n');

					if (this.shouldBreak) {
						const x = text.split('\n')
							.map(t => t == '' ? [createElement('br')] : [createElement('span', t), createElement('br')]);
						x[x.length - 1].pop();
						return x;
					} else {
						return createElement('span', text.replace(/\n/g, ' '));
					}
				}

				case 'bold': {
					return createElement('b', token.bold);
				}

				case 'big': {
					bigCount++;
					const isLong = length(token.big) > 10;
					const isMany = bigCount > 3;
					return (createElement as any)('strong', {
						attrs: {
							style: `display: inline-block; font-size: ${ isMany ? '100%' : '150%' };`
						},
						directives: [this.$store.state.settings.disableAnimatedMfm || isLong || isMany ? {} : {
							name: 'animate-css',
							value: { classes: 'tada', iteration: 'infinite' }
						}]
					}, token.big);
				}

				case 'motion': {
					motionCount++;
					const isLong = length(token.motion) > 10;
					const isMany = motionCount > 3;
					return (createElement as any)('span', {
						attrs: {
							style: 'display: inline-block;'
						},
						directives: [this.$store.state.settings.disableAnimatedMfm || isLong || isMany ? {} : {
							name: 'animate-css',
							value: { classes: 'rubberBand', iteration: 'infinite' }
						}]
					}, token.motion);
				}

				case 'url': {
					return createElement(MkUrl, {
						props: {
							url: token.content,
							target: '_blank'
						}
					});
				}

				case 'link': {
					return createElement('a', {
						attrs: {
							class: 'link',
							href: token.url,
							target: '_blank',
							title: token.url
						}
					}, token.title);
				}

				case 'mention': {
					return (createElement as any)('a', {
						attrs: {
							href: `${url}/@${getAcct(token)}`,
							target: '_blank',
							dataIsMe: (this as any).i && getAcct((this as any).i) == getAcct(token)
						},
						directives: [{
							name: 'user-preview',
							value: token.content
						}]
					}, token.content);
				}

				case 'hashtag': {
					return createElement('a', {
						attrs: {
							href: `${url}/tags/${encodeURIComponent(token.hashtag)}`,
							target: '_blank'
						}
					}, token.content);
				}

				case 'code': {
					return createElement('pre', {
						class: 'code'
					}, [
						createElement('code', {
							domProps: {
								innerHTML: token.html
							}
						})
					]);
				}

				case 'inline-code': {
					return createElement('code', {
						domProps: {
							innerHTML: token.html
						}
					});
				}

				case 'quote': {
					const text2 = token.quote.replace(/(\r\n|\n|\r)/g, '\n');

					if (this.shouldBreak) {
						const x = text2.split('\n')
							.map(t => [createElement('span', t), createElement('br')]);
						x[x.length - 1].pop();
						return createElement('div', {
							attrs: {
								class: 'quote'
							}
						}, x);
					} else {
						return createElement('span', {
							attrs: {
								class: 'quote'
							}
						}, text2.replace(/\n/g, ' '));
					}
				}

				case 'title': {
					return createElement('div', {
						attrs: {
							class: 'title'
						}
					}, token.title);
				}

				case 'emoji': {
					const emoji = emojilib.lib[token.emoji];
					return createElement('span', emoji ? emoji.char : token.content);
				}

				case 'search': {
					return createElement(MkGoogle, {
						props: {
							q: token.query
						}
					});
				}

				default: {
					console.log('unknown ast type:', token.type);
				}
			}
		}));

		// el.tag === 'br' のとき i !== 0 が保証されるため、短絡評価により els[i - 1] は配列外参照しない
		const _els = els.filter((el, i) => !(el.tag === 'br' && ['div', 'pre'].includes(els[i - 1].tag)));
		return createElement('span', _els);
	}
});
