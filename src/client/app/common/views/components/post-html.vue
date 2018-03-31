<template><div class="mk-post-html" v-html="html"></div></template>

<script lang="ts">
import Vue from 'vue';
import getAcct from '../../../../../common/user/get-acct';
import { url } from '../../../config';

function markUrl(a) {
	while (a.firstChild) {
		a.removeChild(a.firstChild);
	}

	const schema = document.createElement('span');
	const delimiter = document.createTextNode('//');
	const host = document.createElement('span');
	const pathname = document.createElement('span');
	const query = document.createElement('span');
	const hash = document.createElement('span');

	schema.className = 'schema';
	schema.textContent = a.protocol;

	host.className = 'host';
	host.textContent = a.host;

	pathname.className = 'pathname';
	pathname.textContent = a.pathname;

	query.className = 'query';
	query.textContent = a.search;

	hash.className = 'hash';
	hash.textContent = a.hash;

	a.appendChild(schema);
	a.appendChild(delimiter);
	a.appendChild(host);
	a.appendChild(pathname);
	a.appendChild(query);
	a.appendChild(hash);
}

function markMe(me, a) {
	a.setAttribute("data-is-me", me && `${url}/@${getAcct(me)}` == a.href);
}

function markTarget(a) {
	a.setAttribute("target", "_blank");
}

export default Vue.component('mk-post-html', {
	props: {
		html: {
			type: String,
			required: true
		},
		i: {
			type: Object,
			default: null
		}
	},
	watch {
		html: {
			handler() {
				this.$nextTick(() => [].forEach.call(this.$el.getElementsByTagName('a'), a => {
					if (a.href === a.textContent) {
						markUrl(a);
					} else {
						markMe((this as any).i, a);
					}

					markTarget(a);
				}));
			},
			immediate: true,
		}
	}
});
</script>

<style lang="stylus">
.mk-post-html
	a
		word-break break-all

		> .schema
			opacity 0.5

		> .host
			font-weight bold

		> .pathname
			opacity 0.8

		> .query
			opacity 0.5

		> .hash
			font-style italic

	p
		margin 0
</style>
