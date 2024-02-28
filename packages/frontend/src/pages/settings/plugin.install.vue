<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormInfo warn>{{ i18n.ts._plugin.installWarn }}</FormInfo>

	<MkCodeEditor v-model="code" lang="is">
		<template #label>{{ i18n.ts.code }}</template>
	</MkCodeEditor>

	<div>
		<MkButton :disabled="code == null" primary inline @click="install"><i class="ti ti-check"></i> {{ i18n.ts.install }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { nextTick, ref, computed } from 'vue';
import MkCodeEditor from '@/components/MkCodeEditor.vue';
import MkButton from '@/components/MkButton.vue';
import FormInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { installPlugin } from '@/scripts/install-plugin.js';
import { unisonReload } from '@/scripts/unison-reload.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const code = ref<string | null>(null);

async function install() {
	if (!code.value) return;

	try {
		await installPlugin(code.value);
		os.success();

		nextTick(() => {
			unisonReload();
		});
	} catch (err) {
		os.alert({
			type: 'error',
			title: 'Install failed',
			text: err.toString() ?? null,
		});
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts._plugin.install,
	icon: 'ti ti-download',
}));
</script>
