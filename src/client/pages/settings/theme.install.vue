<template>
<FormBase>
	<FormGroup>
		<FormTextarea v-model:value="installThemeCode">
			<span>{{ $ts._theme.code }}</span>
		</FormTextarea>
		<FormButton @click="() => preview(installThemeCode)" :disabled="installThemeCode == null" inline><i class="fas fa-eye"></i> {{ $ts.preview }}</FormButton>
	</FormGroup>

	<FormButton @click="() => install(installThemeCode)" :disabled="installThemeCode == null" primary inline><i class="fas fa-check"></i> {{ $ts.install }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPalette, faDownload, faFolderOpen, faCheck, faTrashAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import * as JSON5 from 'json5';
import FormTextarea from '@client/components/form/textarea.vue';
import FormSelect from '@client/components/form/select.vue';
import FormRadios from '@client/components/form/radios.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormLink from '@client/components/form/link.vue';
import FormButton from '@client/components/form/button.vue';
import { applyTheme, validateTheme } from '@client/scripts/theme';
import * as os from '@client/os';
import { ColdDeviceStorage } from '@client/store';
import { addTheme, getThemes } from '@client/theme-store';
import * as symbols from '@client/symbols';

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
				icon: faDownload
			},
			installThemeCode: null,
			faPalette, faDownload, faFolderOpen, faCheck, faTrashAlt, faEye
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
				os.dialog({
					type: 'error',
					text: this.$ts._theme.invalid
				});
				return false;
			}
			if (!validateTheme(theme)) {
				os.dialog({
					type: 'error',
					text: this.$ts._theme.invalid
				});
				return false;
			}
			if (getThemes().some(t => t.id === theme.id)) {
				os.dialog({
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
			os.dialog({
				type: 'success',
				text: this.$t('_theme.installed', { name: theme.name })
			});
		},
	}
});
</script>
