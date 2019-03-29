<template>
<mk-window ref="window" width="450px" height="500px" @closed="destroyDom">
	<template #header><fa icon="list"/> {{ $t('title') }}</template>
	<x-lists :class="$style.content" @listd="l => list = l">
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url } from '../../../config';

export default Vue.extend({
	i18n: i18n('desktop/views/components/game-window.vue'),
	components: {
		XLists: () => import('../../../common/views/components/user-lists.vue').then(m => m.default)
	},
	data() {
		return {
			list: null
		};
	}
});
</script>

<style lang="stylus" module>
.content
	height 100%
	overflow auto

</style>
