<template>
<mfm-core v-bind="$attrs" class="havbbuyv" :class="{ nowrap: $attrs['nowrap'] }" v-once/>
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
	white-space pre-wrap

	&.nowrap
		white-space pre

	>>> .title
		display block
		margin-bottom 4px
		padding 4px
		font-size 90%
		text-align center
		background var(--mfmTitleBg)
		border-radius 4px

	>>> .quote
		display block
		margin 8px
		padding 6px 0 6px 12px
		color var(--mfmQuote)
		border-left solid 3px var(--mfmQuoteLine)

	>>> pre code
		font-size 80%

</style>
