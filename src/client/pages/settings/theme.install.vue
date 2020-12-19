<template>
<FormBase>
	<FormGroup>
		<FormTextarea v-model:value="installThemeCode">
			<span>{{ $t('_theme.code') }}</span>
		</FormTextarea>
		<FormButton @click="() => preview(installThemeCode)" :disabled="installThemeCode == null" inline><Fa :icon="faEye"/> {{ $t('preview') }}</FormButton>
	</FormGroup>

	<FormButton @click="() => install(installThemeCode)" :disabled="installThemeCode == null" primary inline><Fa :icon="faCheck"/> {{ $t('install') }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPalette, faDownload, faFolderOpen, faCheck, faTrashAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import * as JSON5 from 'json5';
import FormTextarea from '@/components/form/textarea.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormLink from '@/components/form/link.vue';
import FormButton from '@/components/form/button.vue';
import { applyTheme, validateTheme } from '@/scripts/theme';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';

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
			INFO: {
				title: this.$t('_theme.install'),
				icon: faDownload
			},
			installThemeCode: null,
			faPalette, faDownload, faFolderOpen, faCheck, faTrashAlt, faEye
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		parseThemeCode(code) {
			let theme;

			try {
				theme = JSON5.parse(code);
			} catch (e) {
				os.dialog({
					type: 'error',
					text: this.$t('_theme.invalid')
				});
				return false;
			}
			if (!validateTheme(theme)) {
				os.dialog({
					type: 'error',
					text: this.$t('_theme.invalid')
				});
				return false;
			}
			if (ColdDeviceStorage.get('themes').some(t => t.id === theme.id)) {
				os.dialog({
					type: 'info',
					text: this.$t('_theme.alreadyInstalled')
				});
				return false;
			}

			return theme;
		},

		preview(code) {
			const theme = this.parseThemeCode(code);
			if (theme) applyTheme(theme, false);
		},

		install(code) {
			const theme = this.parseThemeCode(code);
			if (!theme) return;
			const themes = ColdDeviceStorage.get('themes').concat(theme);
			ColdDeviceStorage.set('themes', themes);
			os.dialog({
				type: 'success',
				text: this.$t('_theme.installed', { name: theme.name })
			});
		},
	}
});
</script>
