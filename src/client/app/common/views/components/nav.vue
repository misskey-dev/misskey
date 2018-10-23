<template>
<span class="mk-nav">
	<a href="https://tri.cash/register" target="_blank">Register Coins</a>
	<i>・</i>
	<a href="https://tri.cash/news/wp/about" target="_blank">%i18n:@about%</a>
	<i>・</i>
	<a href="https://tri.cash/news" target="_blank">News</a>
	<i>・</i>
	<a href="https://tri.cash/news/about" target="_blank">Contact</a>
	<i>・</i>
	<a href="https://tri.cash/news/terms" target="_blank">Terms</a>
	<i>・</i>
	<a href="https://tri.cash/buycrypto.html" target="_blank">Buy Crypto</a>
	<i>・</i>
	<a href="https://tri.cash/market" target="_blank">Market Data</a>
	<i>・</i>
	<a href="https://tri.cash/static/source.zip" target="_blank">Source Code</a>
	<!-- <i>・</i>
	<a href="https://twitter.com/trillionICO" target="_blank">Follow us on %fa:B twitter%</a> -->
</span>
</template>

<script lang="ts">
import Vue from 'vue';
import { lang } from '../../../config';

export default Vue.extend({
	data() {
		return {
			aboutUrl: `/docs/${lang}/about`,
			repositoryUrl: 'https://github.com/syuilo/misskey',
			feedbackUrl: 'https://github.com/syuilo/misskey/issues/new'
		}
	},
	created() {
		(this as any).os.getMeta().then(meta => {
			if (meta.maintainer.repository_url) this.repositoryUrl = meta.maintainer.repository_url;
			if (meta.maintainer.feedback_url) this.feedbackUrl = meta.maintainer.feedback_url;
		});
	}
});
</script>

<style lang="stylus" scoped>
.mk-nav
	a
		color inherit
</style>
