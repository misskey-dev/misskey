<template>
<span class="mk-nav">
	<a :href="aboutUrl">%i18n:@about%</a>
	<i>・</i>
	<a :href="statsUrl">%i18n:@stats%</a>
	<i>・</i>
	<a :href="statusUrl">%i18n:@status%</a>
	<i>・</i>
	<a href="http://zawazawa.jp/misskey/">%i18n:@wiki%</a>
	<i>・</i>
	<a href="https://github.com/syuilo/misskey/blob/master/DONORS.md">%i18n:@donors%</a>
	<i>・</i>
	<a href="https://github.com/syuilo/misskey">%i18n:@repository%</a>
	<i>・</i>
	<a :href="devUrl">%i18n:@develop%</a>
	<i>・</i>
	<a href="https://twitter.com/misskey_xyz" target="_blank">Follow us on %fa:B twitter%</a>
</span>
</template>

<script lang="ts">
import Vue from 'vue';
import { docsUrl, statsUrl, statusUrl, devUrl, lang } from '../../../config';

export default Vue.extend({
	data() {
		return {
			aboutUrl: `${docsUrl}/${lang}/about`,
			statsUrl,
			statusUrl,
			devUrl
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-nav
	a
		color inherit
</style>
