<template>
<div class="_formRoot">
	<FormInfo warn class="_formBlock">{{ i18n.ts.customCssWarn }}</FormInfo>

	<FormTextarea v-model="localCustomCss" manual-save tall class="_monospace _formBlock" style="tab-size: 2;">
		<template #label>CSS</template>
	</FormTextarea>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormInfo from '@/components/MkInfo.vue';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const localCustomCss = ref(localStorage.getItem('customCss') ?? '');

async function apply() {
	localStorage.setItem('customCss', localCustomCss.value);

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

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.customCss,
	icon: 'ti ti-code',
});
</script>
