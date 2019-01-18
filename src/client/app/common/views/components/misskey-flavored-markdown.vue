<template>
<mfm-core v-bind="$attrs" class="havbbuyv"/>
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

	>>> .code
		margin 8px 0

	>>> .quote
		margin 8px
		padding 6px 0 6px 12px
		color var(--mfmQuote)
		border-left solid 3px var(--mfmQuoteLine)

	>>> code
		padding 4px 8px
		margin 0 0.5em
		font-size 80%
		color #525252
		background rgba(0, 0, 0, 0.05)
		border-radius 2px

	>>> pre > code
		padding 16px
		margin 0

	>>> [data-is-me]:after
		content "you"
		padding 0 4px
		margin-left 4px
		font-size 80%
		color var(--primaryForeground)
		background var(--primary)
		border-radius 4px

</style>
