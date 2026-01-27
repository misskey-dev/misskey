<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/navbar" :label="i18n.ts.navbar" icon="ti ti-list" :keywords="['navbar', 'menu', 'sidebar']">
	<div class="_gaps_m">
		<FormSlot>
			<template #label>{{ i18n.ts.navbar }}</template>
			<MkContainer :showHeader="false">
				<MkDraggable
					v-model="items"
					direction="vertical"
				>
					<template #default="{ item }">
						<div
							v-if="item.type === '-' || navbarItemDef[item.type]"
							:class="$style.item"
						>
							<button class="_button" :class="$style.itemHandle"><i class="ti ti-menu"></i></button>
							<i class="ti-fw" :class="[$style.itemIcon, navbarItemDef[item.type]?.icon]"></i><span :class="$style.itemText">{{ navbarItemDef[item.type]?.title ?? i18n.ts.divider }}</span>
							<button class="_button" :class="$style.itemRemove" @click="removeItem(item.id)"><i class="ti ti-x"></i></button>
						</div>
					</template>
				</MkDraggable>
			</MkContainer>
		</FormSlot>
		<div class="_buttons">
			<MkButton @click="addItem"><i class="ti ti-plus"></i> {{ i18n.ts.addItem }}</MkButton>
			<MkButton danger @click="reset"><i class="ti ti-reload"></i> {{ i18n.ts.default }}</MkButton>
			<MkButton primary class="save" @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
		</div>

		<MkRadios
			v-model="menuDisplay"
			:options="[
				{ value: 'sideFull', label: i18n.ts._menuDisplay.sideFull },
				{ value: 'sideIcon', label: i18n.ts._menuDisplay.sideIcon },
			]"
		>
			<template #label>{{ i18n.ts.display }}</template>
		</MkRadios>

		<SearchMarker :keywords="['navbar', 'sidebar', 'toggle', 'button', 'sub']">
			<MkPreferenceContainer k="showNavbarSubButtons">
				<MkSwitch v-model="showNavbarSubButtons">
					<template #label><SearchLabel>{{ i18n.ts._settings.showNavbarSubButtons }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import FormSlot from '@/components/form/slot.vue';
import MkContainer from '@/components/MkContainer.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import MkDraggable from '@/components/MkDraggable.vue';
import * as os from '@/os.js';
import { navbarItemDef } from '@/navbar.js';
import { store } from '@/store.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { prefer } from '@/preferences.js';
import { getInitialPrefValue } from '@/preferences/manager.js';
import { genId } from '@/utility/id.js';

const items = ref(prefer.s.menu.map(x => ({
	id: genId(),
	type: x,
})));
const itemTypeValues = computed(() => items.value.map(x => x.type));

const menuDisplay = store.model('menuDisplay');
const showNavbarSubButtons = prefer.model('showNavbarSubButtons');

async function addItem() {
	const menu = Object.keys(navbarItemDef).filter(k => !itemTypeValues.value.includes(k));
	const { canceled, result: item } = await os.select({
		title: i18n.ts.addItem,
		items: [...menu.map(k => ({
			value: k, label: navbarItemDef[k].title,
		})), {
			value: '-', label: i18n.ts.divider,
		}],
	});
	if (canceled || item == null) return;
	items.value = [...items.value, {
		id: genId(),
		type: item,
	}];
}

function removeItem(itemId: string) {
	items.value = items.value.filter(i => i.id !== itemId);
}

function save() {
	prefer.commit('menu', itemTypeValues.value);
	os.success();
}

function reset() {
	items.value = getInitialPrefValue('menu').map(x => ({
		id: genId(),
		type: x,
	}));
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
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
	color: var(--MI_THEME-navFg);
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
