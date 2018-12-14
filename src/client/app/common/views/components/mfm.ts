import Vue, { VNode } from 'vue';
import { length } from 'stringz';
import { Node } from '../../../../../mfm/parser';
import parse from '../../../../../mfm/parse';
import MkUrl from './url.vue';
import { concat, sum } from '../../../../../prelude/array';
import MkFormula from './formula.vue';
import MkGoogle from './google.vue';
import { toUnicode } from 'punycode';
import syntaxHighlight from '../../../../../mfm/syntax-highlight';

function getTextCount(tokens: Node[]): number {
	const rootCount = sum(tokens.filter(x => x.name === 'text').map(x => length(x.props.text)));
	const childrenCount = sum(tokens.filter(x => x.children).map(x => getTextCount(x.children)));
	return rootCount + childrenCount;
}

function getChildrenCount(tokens: Node[]): number {
	const countTree = tokens.filter(x => x.children).map(x => getChildrenCount(x.children));
	return countTree.length + sum(countTree);
}

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
		plainText: {
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
		}
	},

	render(createElement) {
		if (this.text == null || this.text == '') return;

		const ast = this.ast == null ?
			parse(this.text, this.plainText) : // Parse text to ast
			this.ast as Node[];

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

				case 'big': {
					bigCount++;
					const isLong = getTextCount(token.children) > 10 || getChildrenCount(token.children) > 5;
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

				case 'small': {
					return [createElement('small', genEl(token.children))];
				}

				case 'center': {
					return [createElement('div', {
						attrs: {
							style: 'text-align:center;'
						}
					}, genEl(token.children))];
				}

				case 'motion': {
					motionCount++;
					const isLong = getTextCount(token.children) > 10 || getChildrenCount(token.children) > 5;
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
						key: Math.random(),
						props: {
							url: token.props.url,
							target: '_blank',
							style: 'color:var(--mfmLink);'
						}
					})];
				}

				case 'link': {
					return [createElement('a', {
						attrs: {
							class: 'link',
							href: token.props.url,
							target: '_blank',
							title: token.props.url,
							style: 'color:var(--mfmLink);'
						}
					}, genEl(token.children))];
				}

				case 'mention': {
					const host = token.props.host == null && this.author && this.author.host != null ? this.author.host : token.props.host;
					const canonical = host != null ? `@${token.props.username}@${toUnicode(host)}` : `@${token.props.username}`;
					return (createElement as any)('router-link', {
						key: Math.random(),
						attrs: {
							to: `/${canonical}`,
							// TODO
							//dataIsMe: (this as any).i && getAcct((this as any).i) == getAcct(token),
							style: 'color:var(--mfmMention);'
						},
						directives: [{
							name: 'user-preview',
							value: canonical
						}]
					}, canonical);
				}

				case 'hashtag': {
					return [createElement('router-link', {
						key: Math.random(),
						attrs: {
							to: `/tags/${encodeURIComponent(token.props.hashtag)}`,
							style: 'color:var(--mfmHashtag);'
						}
					}, `#${token.props.hashtag}`)];
				}

				case 'blockCode': {
					return [createElement('pre', {
						class: 'code'
					}, [
						createElement('code', {
							domProps: {
								innerHTML: syntaxHighlight(token.props.code)
							}
						})
					])];
				}

				case 'inlineCode': {
					return [createElement('code', {
						domProps: {
							innerHTML: syntaxHighlight(token.props.code)
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
						key: Math.random(),
						attrs: {
							emoji: token.props.emoji,
							name: token.props.name
						},
						props: {
							customEmojis: this.customEmojis || customEmojis,
							normal: this.plainText
						}
					})];
				}

				case 'math': {
					//const MkFormula = () => import('./formula.vue').then(m => m.default);
					return [createElement(MkFormula, {
						key: Math.random(),
						props: {
							formula: token.props.formula
						}
					})];
				}

				case 'search': {
					//const MkGoogle = () => import('./google.vue').then(m => m.default);
					return [createElement(MkGoogle, {
						key: Math.random(),
						props: {
							q: token.props.query
						}
					})];
				}

				default: {
					console.log('unknown ast type:', token.name);

					return [];
				}
			}
		}));

		// Parse ast to DOM
		return createElement('span', genEl(ast));
	}
});
