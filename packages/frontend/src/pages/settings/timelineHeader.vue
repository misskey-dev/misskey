<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_m">
	<FormSlot>
		<template #label>{{ i18n.ts.timelineHeader }}</template>
		<MkContainer :showHeader="false">
			<div style="overflow-x: auto;">
				<Sortable
					v-model="items"
					itemKey="id"
					:animation="150"
					:handle="'.' + $style.itemHandle"
					@start="e => e.item.classList.add('active')"
					@end="e => e.item.classList.remove('active')"
				>
					<template #item="{element,index}">
						<div
							:class="$style.item"
						>
							<button class="_button" :class="$style.itemHandle"><i class="ti ti-menu"></i></button>
							<i class="ti-fw" :class="[$style.itemIcon, timelineHeaderItemDef[element.type]?.icon]"></i><span :class="$style.itemText">{{ timelineHeaderItemDef[element.type]?.title }}</span>
							<button class="_button" :class="$style.itemRemove" @click="removeItem(index)"><i class="ti ti-x"></i></button>
						</div>
					</template>
				</Sortable>
			</div>
		</MkContainer>
	</FormSlot>
	<MkFoldableSection>
		<template #header>リモートのローカルタイムライン</template>

		<div v-if="remoteLocalTimeline.length < 3">
			<MkInput v-model="tmpName" placeholder="remoteLocalTimeline 1"/>
			<MkInput v-model="tmpServer" placeholder="https://prismisskey.space"/>
			<MkButton @click="addRemote"><i class="ti ti-plus"></i> {{ i18n.ts.addItem }}</MkButton>
		</div>

		<div v-for="(a,i) in remoteLocalTimeline" :key="i">
			<MkInput v-model="remoteLocalTimeline[i]['name']" :placeholder="a"/>
			<MkInput v-model="remoteLocalTimeline[i]['host']" :placeholder="a"/>
			<MkButton danger @click="deleteRemote(i)"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
		</div>
	</MkFoldableSection>
	<div class="_buttons">
		<MkButton @click="addItem"><i class="ti ti-plus"></i> {{ i18n.ts.addItem }}</MkButton>
		<MkButton danger @click="reset"><i class="ti ti-reload"></i> {{ i18n.ts.default }}</MkButton>
		<MkButton primary class="save" @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import FormSlot from '@/components/form/slot.vue';
import MkContainer from '@/components/MkContainer.vue';
import * as os from '@/os.js';
import { defaultStore } from '@/store.js';
import { unisonReload } from '@/scripts/unison-reload.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { timelineHeaderItemDef } from '@/timeline-header.js';
import MkInput from '@/components/MkInput.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { $i } from '@/account.js';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));
const tmpName = ref();
const tmpServer = ref();

const items = ref(defaultStore.state.timelineHeader.map(x => ({
	id: Math.random().toString(),
	type: x,
})));
const remoteLocalTimeline = ref(defaultStore.state.remoteLocalTimeline);
const maxLocalTimeline = $i.policies.localTimelineAnyLimit;

async function reloadAsk() {
	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

async function addRemote() {
	if (!tmpName.value || !tmpServer.value) return;
	if (maxLocalTimeline <= remoteLocalTimeline.value.length) return;
	remoteLocalTimeline.value.push({
		id: Math.random().toString(),
		name: tmpName.value,
		host: tmpServer.value,
	});
	tmpName.value = '';
	tmpServer.value = '';
	await defaultStore.set('remoteLocalTimeline', remoteLocalTimeline.value);
}

const menu = computed(() => {
	return Object.keys(timelineHeaderItemDef).filter(k => !items.value.map(item => item.type).includes(k));
});

async function deleteRemote(index: number) {
	remoteLocalTimeline.value.splice(index, 1);
}

async function addItem() {
	const { canceled, result: item } = await os.select({
		title: i18n.ts.addItem,
		items: [...menu.value.map(k => ({
			value: k, text: timelineHeaderItemDef[k].title,
		}))],
	});
	if (canceled) return;
	items.value = [...items.value, {
		id: Math.random().toString(),
		type: item,
	}];
}

function removeItem(index: number) {
	items.value.splice(index, 1);
}

async function save() {
	defaultStore.set('timelineHeader', items.value.map(x => x.type));
	await reloadAsk();
}

function reset() {
	items.value = defaultStore.def.timelineHeader.default.map(x => ({
		id: Math.random().toString(),
		type: x,
	}));
}

definePageMetadata(() => ({
	title: i18n.ts.navbar,
	icon: 'ti ti-list',
}));
</script>

<style lang="scss" module>
.item {
	position: relative;
	display: block;
	line-height: 2.85rem;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	color: var(--navFg);
	min-width: 200px;
}

.itemIcon {
	position: relative;
	width: 32px;
	margin-right: 8px;
}

.itemText {
	position: relative;
	font-size: 0.9em;
}

.itemRemove {
	position: absolute;
	z-index: 10000;
	width: 32px;
	height: 32px;
	color: #ff2a2a;
	right: 8px;
	opacity: 0.8;
}

.itemHandle {
	cursor: move;
	width: 32px;
	height: 32px;
	margin: 0 8px;
	opacity: 0.5;
}
</style>
