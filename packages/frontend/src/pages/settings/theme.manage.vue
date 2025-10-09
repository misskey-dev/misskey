<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="selectedThemeId" :items="selectedThemeIdDef">
		<template #label>{{ i18n.ts.theme }}</template>
	</MkSelect>
	<template v-if="selectedTheme != null">
		<MkInput readonly :modelValue="selectedTheme.author">
			<template #label>{{ i18n.ts.author }}</template>
		</MkInput>
		<MkTextarea v-if="selectedTheme.desc" readonly :modelValue="selectedTheme.desc">
			<template #label>{{ i18n.ts._theme.description }}</template>
		</MkTextarea>
		<MkTextarea readonly tall :modelValue="selectedThemeCode">
			<template #label>{{ i18n.ts._theme.code }}</template>
			<template #caption><button class="_textButton" @click="copyThemeCode()">{{ i18n.ts.copy }}</button></template>
		</MkTextarea>
		<MkButton v-if="!builtinThemes.some(t => t.id == selectedTheme!.id)" danger @click="uninstall()"><i class="ti ti-trash"></i> {{ i18n.ts.uninstall }}</MkButton>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import JSON5 from 'json5';
import type { Theme } from '@/theme.js';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import { getBuiltinThemesRef, getThemesRef, removeTheme } from '@/theme.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { useMkSelect } from '@/composables/use-mkselect.js';
import type { MkSelectItem } from '@/components/MkSelect.vue';

const installedThemes = getThemesRef();
const builtinThemes = getBuiltinThemesRef();
const {
	model: selectedThemeId,
	def: selectedThemeIdDef,
} = useMkSelect({
	items: computed<MkSelectItem<string | null>[]>(() => [{
		type: 'group',
		label: i18n.ts._theme.installedThemes,
		items: installedThemes.value.map(x => ({ label: x.name, value: x.id })),
	}, {
		type: 'group',
		label: i18n.ts._theme.builtinThemes,
		items: builtinThemes.value.map(x => ({ label: x.name, value: x.id })),
	}]),
	initialValue: null,
});

const themes = computed(() => [...installedThemes.value, ...builtinThemes.value]);

const selectedTheme = computed(() => {
	if (selectedThemeId.value == null) return null;
	return themes.value.find(x => x.id === selectedThemeId.value);
});

const selectedThemeCode = computed(() => {
	if (selectedTheme.value == null) return null;
	return JSON5.stringify(selectedTheme.value, null, '\t');
});

function copyThemeCode() {
	copyToClipboard(selectedThemeCode.value);
}

function uninstall() {
	removeTheme(selectedTheme.value as Theme);
	installedThemes.value = installedThemes.value.filter(t => t.id !== selectedThemeId.value);
	selectedThemeId.value = null;
	os.success();
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts._theme.manage,
	icon: 'ti ti-tool',
}));
</script>
