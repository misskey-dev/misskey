<template>
<div class="_gaps_m">
	<MkSwitch v-model="navWindow">{{ i18n.ts.defaultNavigationBehaviour }}: {{ i18n.ts.openInWindow }}</MkSwitch>

	<MkSwitch v-model="alwaysShowMainColumn">{{ i18n.ts._deck.alwaysShowMainColumn }}</MkSwitch>

	<MkRadios v-model="columnAlign">
		<template #label>{{ i18n.ts._deck.columnAlign }}</template>
		<option value="left">{{ i18n.ts.left }}</option>
		<option value="center">{{ i18n.ts.center }}</option>
	</MkRadios>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRadios from '@/components/MkRadios.vue';
import { deckStore } from '@/ui/deck/deck-store';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const navWindow = computed(deckStore.makeGetterSetter('navWindow'));
const alwaysShowMainColumn = computed(deckStore.makeGetterSetter('alwaysShowMainColumn'));
const columnAlign = computed(deckStore.makeGetterSetter('columnAlign'));

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.deck,
	icon: 'ti ti-columns',
});
</script>
