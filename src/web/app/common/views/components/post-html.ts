declare const _URL_: string;

import Vue from 'vue';
import * as pictograph from 'pictograph';

import MkUrl from './url.vue';

const escape = text =>
	text
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;');

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
					const text = escape(token.content)
						.replace(/(\r\n|\n|\r)/g, '\n');

					if ((this as any).shouldBreak) {
						if (text.indexOf('\n') != -1) {
							const x = text.split('\n').map(t => [createElement('span', t), createElement('br')]);
							x[x.length - 1].pop();
							return x;
						} else {
							return createElement('span', text);
						}
					} else {
						return createElement('span', text.replace(/\n/g, ' '));
					}

				case 'bold':
					return createElement('strong', escape(token.bold));

				case 'url':
					return createElement(MkUrl, {
						props: {
							url: escape(token.content),
							target: '_blank'
						}
					});

				case 'link':
					return createElement('a', {
						attrs: {
							class: 'link',
							href: escape(token.url),
							target: '_blank',
							title: escape(token.url)
						}
					}, escape(token.title));

				case 'mention':
					return (createElement as any)('a', {
						attrs: {
							href: `${_URL_}/${escape(token.username)}`,
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
							href: `${_URL_}/search?q=${escape(token.content)}`,
							target: '_blank'
						}
					}, escape(token.content));

				case 'code':
					return createElement('pre', [
						createElement('code', token.html)
					]);

				case 'inline-code':
					return createElement('code', token.html);

				case 'emoji':
					return createElement('span', pictograph.dic[token.emoji] || token.content);
			}
		}));

		return createElement('span', els);
	}
});
