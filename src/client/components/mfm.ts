import { VNode, defineComponent, h } from 'vue';
import { MfmForest } from '../../mfm/prelude';
import { parse, parsePlain } from '../../mfm/parse';
import MkUrl from './url.vue';
import MkLink from './link.vue';
import MkMention from './mention.vue';
import MkEmoji from './emoji.vue';
import { concat } from '../../prelude/array';
import MkFormula from './formula.vue';
import MkCode from './code.vue';
import MkGoogle from './google.vue';
import MkA from './ui/a.vue';
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

				case 'big': {
					return h('strong', {
						style: `display: inline-block; font-size: 150%;` + (this.$store.state.device.animatedMfm ? 'animation: anime-tada 1s linear infinite both;' : ''),
					}, genEl(token.children));
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

				case 'motion': {
					return h('span', {
						style: 'display: inline-block;' + (this.$store.state.device.animatedMfm ? 'animation: anime-rubberBand 1s linear infinite both;' : ''),
					}, genEl(token.children));
				}

				case 'spin': {
					const direction =
						token.node.props.attr == 'left' ? 'reverse' :
						token.node.props.attr == 'alternate' ? 'alternate' :
						'normal';
					const style = this.$store.state.device.animatedMfm
						? `animation: anime-spin 1.5s linear infinite; animation-direction: ${direction};` : '';
					return h('span', {
						style: 'display: inline-block;' + style
					}, genEl(token.children));
				}

				case 'jump': {
					return h('span', {
						style: this.$store.state.device.animatedMfm ? 'display: inline-block; animation: anime-jump 0.75s linear infinite;' : 'display: inline-block;'
					}, genEl(token.children));
				}

				case 'flip': {
					return h('span', {
						style: 'display: inline-block; transform: scaleX(-1);'
					}, genEl(token.children));
				}

				case 'twitch': {
					return h('span', {
						style: this.$store.state.device.animatedMfm ? 'display: inline-block; animation: anime-twitch 0.5s ease infinite;' : 'display: inline-block;'
					}, genEl(token.children));
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

				case 'title': {
					return [h('div', {
						class: 'title'
					}, genEl(token.children))];
				}

				case 'emoji': {
					return [h(MkEmoji, {
						key: Math.random(),
						emoji: token.node.props.emoji,
						name: token.node.props.name,
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
