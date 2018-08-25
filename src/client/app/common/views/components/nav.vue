<template>
<span class="mk-nav">
	<a :href="aboutUrl">%i18n:@about%</a>
	<i>・</i>
	<a :href="repositoryUrl">%i18n:@repository%</a>
	<i>・</i>
	<a :href="feedbackUrl" target="_blank">%i18n:@feedback%</a>
	<i>・</i>
	<a href="/dev">%i18n:@develop%</a>
	<i>・</i>
	<a href="https://twitter.com/misskey_xyz" target="_blank">Follow us on %fa:B twitter%</a>
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
