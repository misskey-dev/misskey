<template>
<mk-window ref="window" is-modal width="700px" height="550px" @closed="destroyDom">
	<template #header :class="$style.header"><fa icon="cog"/>{{ $t('settings') }}</template>
	<x-settings :initial-page="initialPage" @done="close"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/settings-window.vue'),

	components: {
		XSettings: () => import('./settings.vue').then(m => m.default)
	},

	props: {
		initialPage: {
			type: String,
			required: false
		}
	},
	methods: {
		close() {
			(this as any).$refs.window.close();
		}
	}
});
</script>

<style lang="stylus" module>
.header
	> [data-icon]
		margin-right 4px

</style>
