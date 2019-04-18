<template>
<mk-window ref="window" width="450px" height="500px" @closed="destroyDom">
	<template #header><fa icon="list"/> {{ $t('title') }}</template>
	<x-lists :class="$style.content" @choosen="choosen"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import MkUserListWindow from './user-list-window.vue';

export default Vue.extend({
	i18n: i18n('desktop/views/components/user-lists-window.vue'),
	components: {
		XLists: () => import('../../../common/views/components/user-lists.vue').then(m => m.default)
	},
	methods: {
		close() {
			(this as any).$refs.window.close();
		},
		choosen(list) {
			this.$root.new(MkUserListWindow, {
				list
			});
		}
	}
});
</script>

<style lang="stylus" module>
.content
	height 100%
	overflow auto

</style>
