<template>
<div class="_formRoot">
	<FormInfo warn class="_formBlock">{{ i18n.ts.customCssWarn }}</FormInfo>

	<FormTextarea v-model="localCustomCss" manual-save tall class="_monospace _formBlock" style="tab-size: 2;">
		<template #label>CSS</template>
	</FormTextarea>
</div>
</template>

<script lang="ts" setup>
import { defineExpose, ref, watch } from 'vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormInfo from '@/components/ui/info.vue';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

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

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.customCss,
		icon: 'fas fa-code',
		bg: 'var(--bg)',
	}
});
</script>
