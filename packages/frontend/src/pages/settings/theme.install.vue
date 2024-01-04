<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkCodeEditor v-model="installThemeCode" lang="json5">
		<template #label>{{ i18n.ts._theme.code }}</template>
	</MkCodeEditor>

	<div class="_buttons">
		<MkButton :disabled="installThemeCode == null" inline @click="() => previewTheme(installThemeCode)"><i class="ti ti-eye"></i> {{ i18n.ts.preview }}</MkButton>
		<MkButton :disabled="installThemeCode == null" primary inline @click="() => install(installThemeCode)"><i class="ti ti-check"></i> {{ i18n.ts.install }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkCodeEditor from '@/components/MkCodeEditor.vue';
import MkButton from '@/components/MkButton.vue';
import { parseThemeCode, previewTheme, installTheme } from '@/scripts/install-theme.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const installThemeCode = ref(null);

async function install(code: string): Promise<void> {
	try {
		const theme = parseThemeCode(code);
		await installTheme(code);
		os.alert({
			type: 'success',
			text: i18n.t('_theme.installed', { name: theme.name }),
		});
	} catch (err) {
		switch (err.message.toLowerCase()) {
			case 'this theme is already installed':
				os.alert({
					type: 'info',
					text: i18n.ts._theme.alreadyInstalled,
				});
				break;

			default:
				os.alert({
					type: 'error',
					text: i18n.ts._theme.invalid,
				});
				break;
		}
		console.error(err);
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts._theme.install,
	icon: 'ti ti-download',
});
</script>
