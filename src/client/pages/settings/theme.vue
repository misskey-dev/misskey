<template>
<section class="rfqxtzch _card">
	<div class="_title"><fa :icon="faPalette"/> {{ $t('theme') }}</div>
	<div class="_content">
		<mk-select v-model="theme" :placeholder="$t('theme')">
			<template #label>{{ $t('theme') }}</template>
			<optgroup :label="$t('lightThemes')">
				<option v-for="x in lightThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$t('darkThemes')">
				<option v-for="x in darkThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
			</optgroup>
		</mk-select>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPalette } from '@fortawesome/free-solid-svg-icons';
import MkInput from '../../components/ui/input.vue';
import MkButton from '../../components/ui/button.vue';
import MkSelect from '../../components/ui/select.vue';
import i18n from '../../i18n';
import { Theme, builtinThemes, applyTheme } from '../../theme';

export default Vue.extend({
	i18n,

	components: {
		MkInput,
		MkButton,
		MkSelect,
	},
	
	data() {
		return {
			faPalette
		}
	},

	computed: {
		themes(): Theme[] {
			return builtinThemes.concat(this.$store.state.device.themes);
		},

		installedThemes(): Theme[] {
			return this.$store.state.device.themes;
		},
	
		darkThemes(): Theme[] {
			return this.themes.filter(t => t.base == 'dark' || t.kind == 'dark');
		},

		lightThemes(): Theme[] {
			return this.themes.filter(t => t.base == 'light' || t.kind == 'light');
		},
		
		theme: {
			get() { return this.$store.state.device.theme; },
			set(value) { this.$store.commit('device/set', { key: 'theme', value }); }
		},
	},

	watch: {
		theme() {
			applyTheme(this.themes.find(x => x.id === this.theme));
		}
	},

	methods: {

	}
});
</script>
