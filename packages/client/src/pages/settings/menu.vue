<template>
<div class="_formRoot">
	<FormTextarea v-model="items" tall manual-save class="_formBlock">
		<template #label>{{ i18n.ts.menu }}</template>
		<template #caption><button class="_textButton" @click="addItem">{{ i18n.ts.addItem }}</button></template>
	</FormTextarea>

	<FormRadios v-model="menuDisplay" class="_formBlock">
		<template #label>{{ i18n.ts.display }}</template>
		<option value="sideFull">{{ i18n.ts._menuDisplay.sideFull }}</option>
		<option value="sideIcon">{{ i18n.ts._menuDisplay.sideIcon }}</option>
		<option value="top">{{ i18n.ts._menuDisplay.top }}</option>
		<!-- <MkRadio v-model="menuDisplay" value="hide" disabled>{{ i18n.ts._menuDisplay.hide }}</MkRadio>--> <!-- TODO: サイドバーを完全に隠せるようにすると、別途ハンバーガーボタンのようなものをUIに表示する必要があり面倒 -->
	</FormRadios>

	<FormButton danger class="_formBlock" @click="reset()"><i class="fas fa-redo"></i> {{ i18n.ts.default }}</FormButton>
</div>
</template>

<script lang="ts" setup>
import { computed, defineExpose, ref, watch } from 'vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormRadios from '@/components/form/radios.vue';
import FormButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { menuDef } from '@/menu';
import { defaultStore } from '@/store';
import * as symbols from '@/symbols';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';

const items = ref(defaultStore.state.menu.join('\n'));

const split = computed(() => items.value.trim().split('\n').filter(x => x.trim() !== ''));
const menuDisplay = computed(defaultStore.makeGetterSetter('menuDisplay'));

async function reloadAsk() {
	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting
	});
	if (canceled) return;

	unisonReload();
}

async function addItem() {
	const menu = Object.keys(menuDef).filter(k => !defaultStore.state.menu.includes(k));
	const { canceled, result: item } = await os.select({
		title: i18n.ts.addItem,
		items: [...menu.map(k => ({
			value: k, text: i18n.ts[menuDef[k].title]
		})), {
			value: '-', text: i18n.ts.divider
		}]
	});
	if (canceled) return;
	items.value = [...split.value, item].join('\n');
}

async function save() {
	defaultStore.set('menu', split.value);
	await reloadAsk();
}

function reset() {
	defaultStore.reset('menu');
	items.value = defaultStore.state.menu.join('\n');
}

watch(items, async () => {
	await save();
});

watch(menuDisplay, async () => {
	await reloadAsk();
});

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.menu,
		icon: 'fas fa-list-ul',
		bg: 'var(--bg)',
	}
});
</script>
