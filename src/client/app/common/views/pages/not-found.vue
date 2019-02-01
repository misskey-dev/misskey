<template>
<figure class="megtcxgu">
	<img :src="src" alt="">
	<figcaption>
		<h1><span>Not found</span></h1>
		<p><span>{{ $t('page-not-found') }}</span></p>
	</figcaption>
</figure>
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/pages/not-found.vue'),
	data() {
		return {
			src: ''
		}
	},
	created() {
		this.$root.getMeta().then(meta => {
			if (meta.errorImageUrl)
				this.src = meta.errorImageUrl;
		});
	}
})
</script>

<style lang="stylus" scoped>
.megtcxgu
	align-items center
	bottom 0
	display flex
	justify-content center
	left 0
	margin auto
	position fixed
	right 0
	top 0

	> img
		width 500px

	> figcaption
		margin 8px

		h1,
		p
			color var(--text)
			display flex
			flex-flow column

			*
				position relative
				width 100%

	@media (max-width: 767px)
		flex-flow column

		> figcaption
			text-align center

</style>
