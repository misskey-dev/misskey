<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<MkInfo class="_formBlock">{{ i18n.ts._adminTools._freeze.funcDescription }}</MkInfo>
	<FormTextarea v-model="idList" class="_formBlock">
		<template #caption>{{ i18n.ts._adminTools._freeze.inputBoxCaption }}</template>
	</FormTextarea>
	<MkButton class="_formBlock" inline danger :disabled="!changed" @click="do_freeze()"><i class="fas fa-gavel"></i> {{ i18n.ts._adminTools._freeze.buttonLabels.doFreeze }}</MkButton> 
</MkSpacer>
    
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';
import * as os from '@/os';

import FormLink from '@/components/form/link.vue';
import FormSuspense from '@/components/form/suspense.vue';
import MkButton from '@/components/ui/button.vue';
import MkInfo from '@/components/ui/info.vue';
import FormTextarea from '@/components/form/textarea.vue';

async function init() {
	await os.api('admin/meta');
}

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

const idList = ref('');
const changed = ref(false);

watch(idList, () => {
	changed.value = idList.value.trim() !== '';
});

async function do_freeze() {


	let userIds: string[] = [];
	idList.value.split('\n').forEach((v) => {
		if (v.trim() !== '') {
			userIds.push(v);
		}
	});

	if (userIds.length === 0) {
		changed.value = false;
		return;
	}
	
	{
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.ts._adminTools._freeze.dialogMessages.confirmFreeze,
		});
		if (canceled) return;
	}

	try {
		await Promise.all(userIds.map(async (id) => {
			await os.api('admin/suspend-user', { userId: id });
			await sleep(1000);
		}));
		os.success();
	// eslint-disable-next-line id-denylist
	} catch (e) {
		await os.alert({
			type: 'error',
			// eslint-disable-next-line id-denylist
			text: e.message,
		});
	}

}

defineExpose({
  [symbols.PAGE_INFO]: {
		title: i18n.ts._adminTools.freeze,
		icon: 'fas fa-tools',
		bg: 'var(--bg)',
	}
});
</script>
