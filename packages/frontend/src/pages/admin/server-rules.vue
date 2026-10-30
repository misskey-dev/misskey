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
			<div><SearchText>{{ i18n.ts._serverRules.description }}</SearchText></div>

			<MkDraggable
				v-model="serverRules"
				direction="vertical"
				withGaps
				manualDragStart
			>
				<template #default="{ item, index, dragStart }">
					<div :class="$style.item">
						<div :class="$style.itemHeader">
							<div :class="$style.itemNumber">{{ index + 1 }}</div>
							<span :class="$style.itemHandle" :draggable="true" @dragstart.stop="dragStart"><i class="ti ti-menu"></i></span>
							<button class="_button" :class="$style.itemRemove" @click="remove(item.id)"><i class="ti ti-x"></i></button>
						</div>
						<MkInput :modelValue="item.text" @update:modelValue="serverRules[index].text = $event"/>
					</div>
				</template>
			</MkDraggable>
			<div :class="$style.commands">
				<MkButton rounded @click="add"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
				<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
			</div>
		</div>
	</MkFolder>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as os from '@/os.js';
import { fetchInstance, instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkDraggable from '@/components/MkDraggable.vue';

const serverRules = ref<{ text: string; id: string; }[]>(instance.serverRules.map(text => ({ text, id: Math.random().toString() })));

async function save() {
	await os.apiWithDialog('admin/update-meta', {
		serverRules: serverRules.value.map(r => r.text),
	});
	fetchInstance(true);
}

function add(): void {
	serverRules.value.push({ text: '', id: Math.random().toString() });
}

function remove(id: string): void {
	serverRules.value = serverRules.value.filter(r => r.id !== id);
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
