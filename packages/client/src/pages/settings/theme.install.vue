<template>
<FormBase>
	<FormGroup>
		<FormTextarea v-model="installThemeCode">
			<span>{{ $ts._theme.code }}</span>
		</FormTextarea>
		<FormButton :disabled="installThemeCode == null" inline @click="() => preview(installThemeCode)"><i class="fas fa-eye"></i> {{ $ts.preview }}</FormButton>
	</FormGroup>

	<FormButton :disabled="installThemeCode == null" primary inline @click="() => install(installThemeCode)"><i class="fas fa-check"></i> {{ $ts.install }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as JSON5 from 'json5';
import FormTextarea from '@/components/form/textarea.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormButton from '@/components/debobigego/button.vue';
import { applyTheme, validateTheme } from '@/scripts/theme';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import { addTheme, getThemes } from '@/theme-store';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormTextarea,
		FormSelect,
		FormRadios,
		FormBase,
		FormGroup,
		FormLink,
		FormButton,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts._theme.install,
				icon: 'fas fa-download',
				bg: 'var(--bg)',
			},
			installThemeCode: null,
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		parseThemeCode(code) {
			let theme;

			try {
				theme = JSON5.parse(code);
			} catch (e) {
				os.alert({
					type: 'error',
					text: this.$ts._theme.invalid
				});
				return false;
			}
			if (!validateTheme(theme)) {
				os.alert({
					type: 'error',
					text: this.$ts._theme.invalid
				});
				return false;
			}
			if (getThemes().some(t => t.id === theme.id)) {
				os.alert({
					type: 'info',
					text: this.$ts._theme.alreadyInstalled
				});
				return false;
			}

			return theme;
		},

		preview(code) {
			const theme = this.parseThemeCode(code);
			if (theme) applyTheme(theme, false);
		},

		async install(code) {
			const theme = this.parseThemeCode(code);
			if (!theme) return;
			await addTheme(theme);
			os.alert({
				type: 'success',
				text: this.$t('_theme.installed', { name: theme.name })
			});
		},
	}
});
</script>
