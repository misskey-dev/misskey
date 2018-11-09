<template>
<span class="mk-nav">
	<a :href="aboutUrl">{{ $t('about') }}</a>
	<i>・</i>
	<a :href="repositoryUrl">{{ $t('repository') }}</a>
	<i>・</i>
	<a :href="feedbackUrl" target="_blank">{{ $t('feedback') }}</a>
	<i>・</i>
	<a href="/dev">{{ $t('develop') }}</a>
</span>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { lang } from '../../../config';

export default Vue.extend({
	i18n: i18n('common/views/components/nav.vue'),
	data() {
		return {
			aboutUrl: `/docs/${lang}/about`,
			repositoryUrl: 'https://github.com/syuilo/misskey',
			feedbackUrl: 'https://github.com/syuilo/misskey/issues/new'
		}
	},
	created() {
		this.$root.getMeta().then(meta => {
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
