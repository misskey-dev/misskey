import Vue from 'vue';
import * as emojilib from 'emojilib';
import { url } from '../../../config';
import MkUrl from './url.vue';

export default Vue.component('mk-post-html', {
	props: {
		ast: {
			type: Array,
			required: true
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
		const els = [].concat.apply([], (this as any).ast.map(token => {
			switch (token.type) {
				case 'text':
					const text = token.content.replace(/(\r\n|\n|\r)/g, '\n');

					if ((this as any).shouldBreak) {
						if (text.indexOf('\n') != -1) {
							const x = text.split('\n')
								.map(t => [createElement('span', t), createElement('br')]);
							x[x.length - 1].pop();
							return x;
						} else {
							return createElement('span', text);
						}
					} else {
						return createElement('span', text.replace(/\n/g, ' '));
					}

				case 'bold':
					return createElement('strong', token.bold);

				case 'url':
					return createElement(MkUrl, {
						props: {
							url: token.content,
							target: '_blank'
						}
					});

				case 'link':
					return createElement('a', {
						attrs: {
							class: 'link',
							href: token.url,
							target: '_blank',
							title: token.url
						}
					}, token.title);

				case 'mention':
					return (createElement as any)('a', {
						attrs: {
							href: `${url}/${token.username}`,
							target: '_blank',
							dataIsMe: (this as any).i && (this as any).i.username == token.username
						},
						directives: [{
							name: 'user-preview',
							value: token.content
						}]
					}, token.content);

				case 'hashtag':
					return createElement('a', {
						attrs: {
							href: `${url}/search?q=${token.content}`,
							target: '_blank'
						}
					}, token.content);

				case 'code':
					return createElement('pre', [
						createElement('code', {
							domProps: {
								innerHTML: token.html
							}
						})
					]);

				case 'inline-code':
					return createElement('code', token.html);

				case 'emoji':
					const emoji = emojilib.lib[token.emoji];
					return createElement('span', emoji ? emoji.char : token.content);
			}
		}));

		return createElement('span', els);
	}
});
