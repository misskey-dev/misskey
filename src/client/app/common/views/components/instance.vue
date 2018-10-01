<template>
<div class="nhasjydimbopojusarffqjyktglcuxjy" v-if="meta">
	<div class="banner" :style="{ backgroundImage: meta.bannerUrl ? `url(${meta.bannerUrl})` : null }"></div>

	<h1>{{ meta.name }}</h1>
	<p v-html="meta.description || '%i18n:common.about%'"></p>
	<router-link to="/">%i18n:@start%</router-link>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			meta: null
		}
	},
	created() {
		(this as any).os.getMeta().then(meta => {
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
