<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		none
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';

async function init() {
	await os.api('admin/meta');
}

function save() {
	os.apiWithDialog('admin/update-meta').then(() => {
		fetchInstance();
	});
}

defineExpose({
  [symbols.PAGE_INFO]: {
		title: i18n.ts.other,
		icon: 'fas fa-cogs',
		bg: 'var(--bg)',
		actions: [{
			asFullButton: true,
			icon: 'fas fa-check',
			text: i18n.ts.save,
			handler: save,
		}],
	}
});
</script>
