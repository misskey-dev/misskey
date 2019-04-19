<template>
<ui-card>
	<template #title><fa :icon="faMobile"/> {{ $t('title') }}</template>

	<section class="fit-top">
		<ui-select v-model="lang" :placeholder="$t('select-app-type')">
			<option v-for="x in ['auto', 'desktop', 'mobile']" :value="x" :key="x">{{ $t(`choices.${x}`) }}</option>
		</ui-select>
		<ui-info>Current: <i>{{ $t(currentAppType) }}</i></ui-info>
		<ui-info warn>{{ $t('info') }}</ui-info>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { langs } from '../../../../config';
import { faMobile } from '@fortawesome/free-solid-svg-icons'

export default Vue.extend({
	i18n: i18n('common/views/components/settings/client-mode.vue'),

	data() {
		return {
			langs,
			currentAppType: (window as any).appType,

			faMobile
		};
	},

	computed: {
		appTypeForce: {
			get() { return this.$store.state.device.appTypeForce; },
			set(value) { this.$store.commit('device/set', { key: 'appTypeForce', value }); }
		},
	},
});
</script>
