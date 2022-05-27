<template>
<div class="_formRoot">
	<FormGroup>
		<template #label>{{ i18n.ts.defaultNavigationBehaviour }}</template>
		<FormSwitch v-model="navWindow">{{ i18n.ts.openInWindow }}</FormSwitch>
	</FormGroup>

	<FormSwitch v-model="alwaysShowMainColumn" class="_formBlock">{{ i18n.ts._deck.alwaysShowMainColumn }}</FormSwitch>

	<FormRadios v-model="columnAlign" class="_formBlock">
		<template #label>{{ i18n.ts._deck.columnAlign }}</template>
		<option value="left">{{ i18n.ts.left }}</option>
		<option value="center">{{ i18n.ts.center }}</option>
	</FormRadios>

	<FormRadios v-model="columnHeaderHeight" class="_formBlock">
		<template #label>{{ i18n.ts._deck.columnHeaderHeight }}</template>
		<option :value="42">{{ i18n.ts.narrow }}</option>
		<option :value="45">{{ i18n.ts.medium }}</option>
		<option :value="48">{{ i18n.ts.wide }}</option>
	</FormRadios>

	<FormInput v-model="columnMargin" type="number" class="_formBlock">
		<template #label>{{ i18n.ts._deck.columnMargin }}</template>
		<template #suffix>px</template>
	</FormInput>

	<FormLink class="_formBlock" @click="setProfile">{{ i18n.ts._deck.profile }}<template #suffix>{{ profile }}</template></FormLink>
</div>
</template>

<script lang="ts" setup>
import { computed, defineExpose, watch } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormLink from '@/components/form/link.vue';
import FormRadios from '@/components/form/radios.vue';
import FormInput from '@/components/form/input.vue';
import FormGroup from '@/components/form/group.vue';
import { deckStore } from '@/ui/deck/deck-store';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const navWindow = computed(deckStore.makeGetterSetter('navWindow'));
const alwaysShowMainColumn = computed(deckStore.makeGetterSetter('alwaysShowMainColumn'));
const columnAlign = computed(deckStore.makeGetterSetter('columnAlign'));
const columnMargin = computed(deckStore.makeGetterSetter('columnMargin'));
const columnHeaderHeight = computed(deckStore.makeGetterSetter('columnHeaderHeight'));
const profile = computed(deckStore.makeGetterSetter('profile'));

watch(navWindow, async () => {
	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
});

async function setProfile() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts._deck.profile,
		allowEmpty: false
	});
	if (canceled) return;
	
	profile.value = name;
	unisonReload();
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.deck,
		icon: 'fas fa-columns',
		bg: 'var(--bg)',
	}
});
</script>
