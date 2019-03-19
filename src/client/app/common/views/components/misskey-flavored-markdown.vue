<template>
<mfm-core v-bind="$attrs" class="havbbuyv" v-once/>
</template>

<script lang="ts">
import Vue from 'vue';
import MfmCore from './mfm';

export default Vue.extend({
	components: {
		MfmCore
	}
});
</script>

<style lang="stylus" scoped>
.havbbuyv
	>>> .title
		display block
		margin-bottom 4px
		padding 4px
		font-size 90%
		text-align center
		background var(--mfmTitleBg)
		border-radius 4px

	>>> .quote
		margin 8px
		padding 6px 0 6px 12px
		color var(--mfmQuote)
		border-left solid 3px var(--mfmQuoteLine)

	>>> .bubble
		display flex
		margin 8px

		> :not(:last-child)
			line-height 1
			margin 12px 0 0

		> strong:not(:last-child)
			margin 8px 0 0

		> small:not(:last-child)
			margin 14px 0 0

		> img:not(:last-child)
			margin 10px 0 0

			&.custom
				margin 0

		&::before
			border-color transparent var(--faceDivider) transparent transparent
			border-style solid solid outset
			border-width 8px
			content ''
			height 0
			margin 12px 0 0
			order 1
			width 0

		> :last-child
			background var(--faceDivider)
			border-radius 8px
			flex 0 1 auto
			order 2
			padding 8px

		&::after
			content ''
			flex 1 1 auto
			order 3

	>>> pre code
		font-size 80%

</style>
