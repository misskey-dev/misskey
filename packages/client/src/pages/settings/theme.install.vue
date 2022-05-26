<template>
<div class="_formRoot">
	<FormTextarea v-model="installThemeCode" class="_formBlock">
		<template #label>{{ i18n.ts._theme.code }}</template>
	</FormTextarea>

	<div class="_formBlock" style="display: flex; gap: var(--margin); flex-wrap: wrap;">
		<FormButton :disabled="installThemeCode == null" inline @click="() => preview(installThemeCode)"><i class="fas fa-eye"></i> {{ i18n.ts.preview }}</FormButton>
		<FormButton :disabled="installThemeCode == null" primary inline @click="() => install(installThemeCode)"><i class="fas fa-check"></i> {{ i18n.ts.install }}</FormButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import JSON5 from 'json5';
import FormTextarea from '@/components/form/textarea.vue';
import FormButton from '@/components/ui/button.vue';
import { applyTheme, validateTheme } from '@/scripts/theme';
import * as os from '@/os';
import { addTheme, getThemes } from '@/theme-store';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

let installThemeCode = $ref(null);

function parseThemeCode(code: string) {
	let theme;

	try {
		theme = JSON5.parse(code);
	} catch (err) {
		os.alert({
			type: 'error',
			text: i18n.ts._theme.invalid
		});
		return false;
	}
	if (!validateTheme(theme)) {
		os.alert({
			type: 'error',
			text: i18n.ts._theme.invalid
		});
		return false;
	}
	if (getThemes().some(t => t.id === theme.id)) {
		os.alert({
			type: 'info',
			text: i18n.ts._theme.alreadyInstalled
		});
		return false;
	}

	return theme;
}

function preview(code: string): void {
	const theme = parseThemeCode(code);
	if (theme) applyTheme(theme, false);
}

async function install(code: string): Promise<void> {
	const theme = parseThemeCode(code);
	if (!theme) return;
	await addTheme(theme);
	os.alert({
		type: 'success',
		text: i18n.t('_theme.installed', { name: theme.name })
	});
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts._theme.install,
		icon: 'fas fa-download',
		bg: 'var(--bg)',
	},
});
</script>
