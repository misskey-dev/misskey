<template>
<div class="nhasjydimbopojusarffqjyktglcuxjy" v-if="meta">
	<div class="banner" :style="{ backgroundImage: meta.bannerUrl ? `url(${meta.bannerUrl})` : null }"></div>

	<h1>{{ meta.name || 'Groundpolis' }}</h1>
	<p v-html="meta.description || this.$t('@.about')"></p>
	<router-link to="/">{{ $t('start') }}</router-link>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/instance.vue'),
	data() {
		return {
			meta: null
		}
	},
	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});
	}
});
</script>

<style lang="stylus" scoped>
.nhasjydimbopojusarffqjyktglcuxjy
	color var(--text)
	background var(--face)
	text-align center

	> .banner
		height 100px
		background-position center
		background-size cover

	> h1
		margin 16px
		font-size 16px

	> p
		margin 16px
		font-size 14px

	> a
		display block
		padding-bottom 16px

</style>
