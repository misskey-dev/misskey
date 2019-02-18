<template>
<ui-card>
	<template #title><fa icon="language"/> {{ $t('title') }}</template>

	<section class="fit-top">
		<ui-select v-model="lang" :placeholder="$t('pick-language')">
			<optgroup :label="$t('recommended')">
				<option value="">{{ $t('auto') }}</option>
			</optgroup>

			<optgroup :label="$t('specify-language')">
				<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
			</optgroup>
		</ui-select>
		<ui-info>Current: <i>{{ currentLanguage }}</i></ui-info>
		<ui-info warn>{{ $t('info') }}</ui-info>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { langs } from '../../../config';

export default Vue.extend({
	i18n: i18n('common/views/components/language-settings.vue'),

	data() {
		return {
			langs,
			currentLanguage: 'Unknown',
		};
	},

	computed: {
		lang: {
			get() { return this.$store.state.device.lang; },
			set(value) { this.$store.commit('device/set', { key: 'lang', value }); }
		},
	},

	created() {
		try {
			const locale = JSON.parse(localStorage.getItem('locale') || "{}");
			const localeKey = localStorage.getItem('localeKey');
			this.currentLanguage = `${locale.meta.lang} (${localeKey})`;
		} catch { }
	},

	methods: {
	}
});
</script>
