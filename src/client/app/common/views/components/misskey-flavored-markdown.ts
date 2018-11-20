import Vue, { VNode } from 'vue';
import { length } from 'stringz';
import { Node } from '../../../../../mfm/parser';
import parse from '../../../../../mfm/parse';
import getAcct from '../../../../../misc/acct/render';
import MkUrl from './url.vue';
import { concat } from '../../../../../prelude/array';
import MkFormula from './formula.vue';
import MkGoogle from './google.vue';

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
		},
		customEmojis: {
			required: false,
		}
	},

	render(createElement) {
		let ast: Node[];

		if (this.ast == null) {
			// Parse text to ast
			ast = parse(this.text);
		} else {
			ast = this.ast as Node[];
		}

		let bigCount = 0;
		let motionCount = 0;

		const genEl = (ast: Node[]) => concat(ast.map((token): VNode[] => {
			switch (token.name) {
				case 'text': {
					const text = token.props.text.replace(/(\r\n|\n|\r)/g, '\n');

					if (this.shouldBreak) {
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
					}, genEl(token.children));
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
					}, genEl(token.children));
				}

				case 'url': {
					return [createElement(MkUrl, {
						props: {
							url: token.content,
							target: '_blank',
							style: 'color:var(--mfmLink);'
						}
					})];
				}

				case 'link': {
					return [createElement('a', {
						attrs: {
							class: 'link',
							href: token.url,
							target: '_blank',
							title: token.url,
							style: 'color:var(--mfmLink);'
						}
					}, genEl(token.children))];
				}

				case 'mention': {
					return (createElement as any)('router-link', {
						attrs: {
							to: `/${token.canonical}`,
							dataIsMe: (this as any).i && getAcct((this as any).i) == getAcct(token),
							style: 'color:var(--mfmMention);'
						},
						directives: [{
							name: 'user-preview',
							value: token.canonical
						}]
					}, token.canonical);
				}

				case 'hashtag': {
					return [createElement('router-link', {
						attrs: {
							to: `/tags/${encodeURIComponent(token.hashtag)}`,
							style: 'color:var(--mfmHashtag);'
						}
					}, token.content)];
				}

				case 'code': {
					return [createElement('pre', {
						class: 'code'
					}, [
						createElement('code', {
							domProps: {
								innerHTML: token.html
							}
						})
					])];
				}

				case 'inline-code': {
					return [createElement('code', {
						domProps: {
							innerHTML: token.html
						}
					})];
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
						attrs: {
							emoji: token.emoji,
							name: token.name
						},
						props: {
							customEmojis: this.customEmojis || customEmojis
						}
					})];
				}

				case 'math': {
					//const MkFormula = () => import('./formula.vue').then(m => m.default);
					return [createElement(MkFormula, {
						props: {
							formula: token.formula
						}
					})];
				}

				case 'search': {
					//const MkGoogle = () => import('./google.vue').then(m => m.default);
					return [createElement(MkGoogle, {
						props: {
							q: token.query
						}
					})];
				}

				default: {
					console.log('unknown ast type:', token.type);

					return [];
				}
			}
		}));

		// Parse ast to DOM
		return createElement('span', genEl(ast));
	}
});
