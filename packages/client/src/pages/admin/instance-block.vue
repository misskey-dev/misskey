<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<FormTextarea v-model="blockedHosts" class="_formBlock">
			<span>{{ i18n.ts.blockedInstances }}</span>
			<template #caption>{{ i18n.ts.blockedInstancesDescription }}</template>
		</FormTextarea>

		<FormButton primary class="_formBlock" @click="save"><i class="fas fa-save"></i> {{ i18n.ts.save }}</FormButton>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import FormButton from '@/components/ui/button.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';

let blockedHosts: string = $ref('');

async function init() {
	const meta = await os.api('admin/meta');
	blockedHosts = meta.blockedHosts.join('\n');
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		blockedHosts: blockedHosts.split('\n') || [],
	}).then(() => {
		fetchInstance();
	});
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.instanceBlocking,
		icon: 'fas fa-ban',
		bg: 'var(--bg)',
	}
});
</script>
