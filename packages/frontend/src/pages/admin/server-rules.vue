<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker markerId="serverRules" :keywords="['rules']">
	<MkFolder>
		<template #icon><SearchIcon><i class="ti ti-checkbox"></i></SearchIcon></template>
		<template #label><SearchLabel>{{ i18n.ts.serverRules }}</SearchLabel></template>

		<div class="_gaps_m">
			<div>{{ i18n.ts._serverRules.description }}</div>
			<div ref="dndParentEl" class="_gaps_m">
				<div v-for="rule, index in serverRules" :key="rule.id" :class="$style.item">
					<div :class="$style.itemHeader">
						<div :class="$style.itemNumber" v-text="String(index + 1)"/>
						<span :class="$style.itemHandle" class="handle"><i class="ti ti-menu"/></span>
						<button class="_button" :class="$style.itemRemove" @click="remove(rule.id)"><i class="ti ti-x"></i></button>
					</div>
					<MkInput v-model="rule.value"/>
				</div>
			</div>
			<div :class="$style.commands">
				<MkButton rounded @click="add"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
				<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
			</div>
		</div>
	</MkFolder>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import { animations } from '@formkit/drag-and-drop';
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
import { genId } from '@/utility/id.js';
import * as os from '@/os.js';
import { fetchInstance, instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkFolder from '@/components/MkFolder.vue';

const serverRules = ref<{ id: string; value: string; }[]>(instance.serverRules.map((rule: string) => ({ id: genId(), value: rule })));

const dndParentEl = useTemplateRef('dndParentEl');

dragAndDrop({
	parent: dndParentEl,
	values: serverRules,
	plugins: [animations()],
	dragHandle: '.handle',
});

async function save() {
	await os.apiWithDialog('admin/update-meta', {
		serverRules: serverRules.value.map(rule => rule.value),
	});
	fetchInstance(true);
}

function add() {
	serverRules.value.push({ id: genId(), value: '' });
}

function remove(id: string) {
	serverRules.value = serverRules.value.filter(rule => rule.id !== id);
}
</script>

<style lang="scss" module>
.item {
	display: block;
	color: var(--MI_THEME-navFg);
}

.itemHeader {
	display: flex;
	margin-bottom: 8px;
	align-items: center;
}

.itemHandle {
	display: flex;
	width: 40px;
	height: 40px;
	align-items: center;
	justify-content: center;
	cursor: move;
}

.itemNumber {
	display: flex;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 14px;
	font-weight: bold;
	width: 28px;
	height: 28px;
	align-items: center;
	justify-content: center;
	border-radius: 999px;
	margin-right: 8px;
}

.itemEdit {
	width: 100%;
	max-width: 100%;
	min-width: 100%;
}

.itemRemove {
	width: 40px;
	height: 40px;
	color: var(--MI_THEME-error);
	margin-left: auto;
	border-radius: 6px;

	&:hover {
		background: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05));
	}
}

.commands {
	display: flex;
	gap: 16px;
}
</style>
