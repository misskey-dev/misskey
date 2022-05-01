<template>
<div class="_formRoot">
	<MkInfo>{{ i18n.ts._instanceMute.title }}</MkInfo>
	<FormTextarea v-model="instanceMutes" class="_formBlock">
		<template #label>{{ i18n.ts._instanceMute.heading }}</template>
		<template #caption>{{ i18n.ts._instanceMute.instanceMuteDescription }}<br>{{ i18n.ts._instanceMute.instanceMuteDescription2 }}</template>
	</FormTextarea>
	<MkButton primary :disabled="!changed" class="_formBlock" @click="save()"><i class="fas fa-save"></i> {{ i18n.ts.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { defineExpose, ref, watch } from 'vue';
import FormTextarea from '@/components/form/textarea.vue';
import MkInfo from '@/components/ui/info.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { $i } from '@/account';
import { i18n } from '@/i18n';

const instanceMutes = ref($i!.mutedInstances.join('\n'));
const changed = ref(false);

async function save() {
	let mutes = instanceMutes.value
		.trim().split('\n')
		.map(el => el.trim())
		.filter(el => el);

	await os.api('i/update', {
		mutedInstances: mutes,
	});

	changed.value = false;

	// Refresh filtered list to signal to the user how they've been saved
	instanceMutes.value = mutes.join('\n');
}

watch(instanceMutes, () => {
	changed.value = true;
});

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.instanceMute,
		icon: 'fas fa-volume-mute'
	}
});
</script>
