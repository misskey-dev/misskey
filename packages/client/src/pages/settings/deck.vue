<template>
<div class="_formRoot">
	<FormSwitch v-model="navWindow">{{ i18n.ts.defaultNavigationBehaviour }}: {{ i18n.ts.openInWindow }}</FormSwitch>

	<FormSwitch v-model="alwaysShowMainColumn" class="_formBlock">{{ i18n.ts._deck.alwaysShowMainColumn }}</FormSwitch>

	<FormRadios v-model="columnAlign" class="_formBlock">
		<template #label>{{ i18n.ts._deck.columnAlign }}</template>
		<option value="left">{{ i18n.ts.left }}</option>
		<option value="center">{{ i18n.ts.center }}</option>
	</FormRadios>

	<FormLink class="_formBlock" @click="setProfile">{{ i18n.ts._deck.profile }}<template #suffix>{{ profile }}</template></FormLink>
</div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormLink from '@/components/form/link.vue';
import FormRadios from '@/components/form/radios.vue';
import FormInput from '@/components/form/input.vue';
import { deckStore } from '@/ui/deck/deck-store';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const navWindow = computed(deckStore.makeGetterSetter('navWindow'));
const alwaysShowMainColumn = computed(deckStore.makeGetterSetter('alwaysShowMainColumn'));
const columnAlign = computed(deckStore.makeGetterSetter('columnAlign'));
const profile = computed(deckStore.makeGetterSetter('profile'));

async function setProfile() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts._deck.profile,
		allowEmpty: false,
	});
	if (canceled) return;
	
	profile.value = name;
	unisonReload();
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.deck,
	icon: 'fas fa-columns',
});
</script>
