<template>
<mk-ui>
	<span slot="header"><span style="margin-right:4px;"><fa :icon="faHashtag"/></span>{{ $t('@.explore') }}</span>

	<main>
		<x-explore/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import XExplore from '../../../common/views/pages/explore.vue';

export default Vue.extend({
	i18n: i18n(''),
	components: {
		XExplore
	},
	data() {
		return {
			faHashtag
		};
	},
});
</script>

<style lang="stylus" scoped>
main
	width 100%
	max-width 680px
	margin 0 auto
	padding 8px

	@media (min-width 500px)
		padding 16px

	@media (min-width 600px)
		padding 32px

</style>
