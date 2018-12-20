<template>
<form class="wlvfdpkp" @submit.prevent="onSubmit">
	<i><fa icon="search"/></i>
	<input v-model="q" type="search" :placeholder="$t('placeholder')" v-autocomplete="{ model: 'q' }"/>
	<div class="result"></div>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/ui.header.search.vue'),
	data() {
		return {
			q: '',
			wait: false
		};
	},
	methods: {
		async onSubmit() {
			if (this.wait) return;

			const q = this.q.trim();
			if (q.startsWith('@')) {
				this.$router.push(`/${q}`);
			} else if (q.startsWith('#')) {
				this.$router.push(`/tags/${encodeURIComponent(q.substr(1))}`);
			} else if (q.startsWith('https://')) {
				this.wait = true;
				try {
					const res = await this.$root.api('ap/show', {
						uri: q
					});
					if (res.type == 'User') {
						this.$router.push(`/@${res.object.username}@${res.object.host}`);
					} else if (res.type == 'Note') {
						this.$router.push(`/notes/${res.object.id}`);
					}
				} catch (e) {
					// TODO
				}
				this.wait = false;
			} else {
				this.$router.push(`/search?q=${encodeURIComponent(q)}`);
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.wlvfdpkp
	@media (max-width 800px)
		display none !important

	> i
		display block
		position absolute
		top 0
		left 0
		width 48px
		text-align center
		line-height 48px
		color var(--desktopHeaderFg)
		pointer-events none

		> *
			vertical-align middle

	> input
		user-select text
		cursor auto
		margin 8px 0 0 0
		padding 6px 18px 6px 36px
		width 14em
		height 32px
		font-size 1em
		background var(--desktopHeaderSearchBg)
		outline none
		border none
		border-radius 16px
		transition color 0.5s ease, border 0.5s ease
		color var(--desktopHeaderSearchFg)

		@media (max-width 1000px)
			width 10em

		&::placeholder
			color var(--desktopHeaderFg)

		&:hover
			background var(--desktopHeaderSearchHoverBg)

		&:focus
			box-shadow 0 0 0 2px var(--primaryAlpha05) !important

</style>
