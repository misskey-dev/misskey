<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormInfo warn>{{ i18n.ts.customCssWarn }}</FormInfo>

	<FormInfo v-if="isSafeMode" warn>{{ i18n.ts.customCssIsDisabledBecauseSafeMode }}</FormInfo>

	<MkCodeEditor v-model="localCustomCss" manualSave lang="css">
		<template #label>CSS</template>
	</MkCodeEditor>
</div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import MkCodeEditor from '@/components/MkCodeEditor.vue';
import FormInfo from '@/components/MkInfo.vue';
import { isSafeMode } from '@@/js/config.js';
import * as os from '@/os.js';
import { unisonReload } from '@/utility/unison-reload.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { miLocalStorage } from '@/local-storage.js';

const localCustomCss = ref(miLocalStorage.getItem('customCss') ?? '');

async function apply() {
	miLocalStorage.setItem('customCss', localCustomCss.value);

	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

watch(localCustomCss, async () => {
	await apply();
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.customCss,
	icon: 'ti ti-code',
}));
</script>
