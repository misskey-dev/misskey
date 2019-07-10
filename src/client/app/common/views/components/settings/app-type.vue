<template>
<ui-card>
	<template #title><fa :icon="faMobileAlt"/> {{ $t('title') }}</template>

	<section class="fit-top">
		<p>{{ $t('intro') }}</p>
		<ui-select v-model="appTypeForce" :placeholder="$t('intro')">
			<option v-for="x in ['auto', 'desktop', 'mobile']" :value="x" :key="x">{{ $t(`choices.${x}`) }}</option>
		</ui-select>
		<ui-info warn>{{ $t('info') }}</ui-info>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { faMobileAlt } from '@fortawesome/free-solid-svg-icons'

export default Vue.extend({
	i18n: i18n('common/views/components/settings/app-type.vue'),

	data() {
		return {
			faMobileAlt
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
