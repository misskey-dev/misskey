<template>
<div class="note">
	<button @click="post" :title="$t('post')"><fa icon="pencil-alt"/></button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/ui.header.post.vue'),
	methods: {
		post() {
			this.$post();
		}
	}
});
</script>

<style lang="stylus" scoped>
.note
	display inline-block
	padding 8px
	height 100%
	vertical-align top

	> button
		display inline-block
		margin 0
		padding 0 10px
		height 100%
		font-size 1.2em
		font-weight normal
		text-decoration none
		color var(--primaryForeground)
		background var(--primary) !important
		outline none
		border none
		border-radius 4px
		transition background 0.1s ease
		cursor pointer

		*
			pointer-events none

		&:hover
			background var(--primaryLighten10) !important

		&:active
			background var(--primaryDarken10) !important
			transition background 0s ease

</style>
