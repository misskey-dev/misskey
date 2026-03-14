<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/postform-buttons" :label="i18n.ts.postFormButtons" icon="ti ti-forms" :keywords="['post', 'form', 'button', 'bottom']">
	<div class="_gaps_m">
		<FormSlot>
			<template #label>{{ i18n.ts.postFormButtons }}</template>
			<MkContainer :showHeader="false">
				<MkDraggable
					v-model="items"
					direction="vertical"
				>
					<template #default="{item,index,dragStart}">
						<div
							v-if="bottomItemDef[item.type]"
							:class="$style.item"
						>
							<button class="_button" :class="$style.itemHandle" @mousedown="dragStart" @touchstart="dragStart"><i class="ti ti-menu"></i></button>
							<i class="ti ti-fw" :class="[$style.itemIcon, bottomItemDef[item.type]?.icon]"></i><span :class="$style.itemText">{{ bottomItemDef[item.type]?.title }}</span>
							<button class="_button" :class="$style.itemRemove" @click="removeItem(index)"><i class="ti ti-x"></i></button>
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
		<div style="font-size: 0.85em; padding: 8px 0;">{{ i18n.ts.postFormBottomSettingsDescription }}</div>

		<SearchMarker :keywords="['postform', 'button', 'settings', 'sub']">
			<MkPreferenceContainer k="showPostFormSubButtons">
				<MkSwitch v-model="showPostFormSubButtons">
					<template #label><SearchLabel>{{ i18n.ts._settings.showPostFormSubButtons }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import FormSlot from '@/components/form/slot.vue';
import MkContainer from '@/components/MkContainer.vue';
import MkDraggable from '@/components/MkDraggable.vue';
import * as os from '@/os.js';
import { bottomItemDef } from '@/utility/post-form.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { prefer } from '@/preferences.js';
import { genId } from '@/utility/id.js';

// デフォルト値
const defaultActions = [
	'mention',
	'attachFile',
	'emoji',
	'addMfmFunction',
	'scheduledNoteDelete',
	'useCw',
	'poll',
	'hashtags',
	'plugins',
];

// 不正なキーをフィルタリングして初期化
const items = ref((prefer.s.postFormActions || defaultActions)
	.filter(x => bottomItemDef[x] !== undefined)
	.map(x => ({
		id: genId(),
		type: x,
	})));

const showPostFormSubButtons = prefer.model('showPostFormSubButtons');

async function addItem() {
	const currentItems = items.value.map(x => x.type);
	const availableButtons = Object.keys(bottomItemDef).filter(k => !currentItems.includes(k));

	const { canceled, result: item } = await os.select({
		title: i18n.ts.addItem,
		items: availableButtons.map(k => ({
			value: k, label: bottomItemDef[k].title,
		})),
	});

	if (canceled || item == null) return;
	items.value = [...items.value, {
		id: genId(),
		type: item,
	}];
}

function removeItem(index: number) {
	items.value.splice(index, 1);
}

async function save() {
	prefer.commit('postFormActions', items.value.map(x => x.type));
	await os.success();
}

function reset() {
	items.value = defaultActions.map(x => ({
		id: genId(),
		type: x,
	}));
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.postFormButtons,
	icon: 'ti ti-forms',
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
	display: inline-block;
	position: relative;
	width: 32px;
	margin-right: 8px;
	text-align: center;
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
