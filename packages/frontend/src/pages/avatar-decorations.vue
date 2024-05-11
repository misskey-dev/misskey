<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<MkSwitch v-model="select">SelectMode</MkSwitch>
		<MkButton @click="setCategoryBulk">Set Category</MkButton>
		<MkButton @click="deletes">Delete</MkButton>
		<div class="_gaps">
			<div :class="$style.decorations">
				<XDecoration
					v-for="avatarDecoration in avatarDecorations"
					:key="avatarDecoration.id"
					:class=" selectItemsId.includes(avatarDecoration.id) ? $style.selected : '' "
					:decoration="avatarDecoration"
					@click="select ? selectItems(avatarDecoration.id) : openDecorationEdit(avatarDecoration)"
				/>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, defineAsyncComponent, watch } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import XDecoration from '@/pages/settings/avatar-decoration.decoration.vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';

const avatarDecorations = ref<Misskey.entities.AdminAvatarDecorationsListResponse>([]);
const select = ref(false);
const selectItemsId = ref<string[]>([]);

function add() {
	avatarDecorations.value.unshift({
		_id: Math.random().toString(36),
		id: null,
		name: '',
		description: '',
		url: '',
		category: '',
	});
}

function selectItems(decorationId) {
	if (selectItemsId.value.includes(decorationId)) {
		const index = selectItemsId.value.indexOf(decorationId);
		selectItemsId.value.splice(index, 1);
	} else {
		selectItemsId.value.push(decorationId);
	}
}

function del(avatarDecoration) {
	os.confirm({
		type: 'warning',
		text: i18n.tsx.deleteAreYouSure({ x: avatarDecoration.name }),
	}).then(({ canceled }) => {
		if (canceled) return;
		avatarDecorations.value = avatarDecorations.value.filter(x => x !== avatarDecoration);
		misskeyApi('admin/avatar-decorations/delete', avatarDecoration);
	});
}

async function save(avatarDecoration) {
	if (avatarDecoration.id == null) {
		await os.apiWithDialog('admin/avatar-decorations/create', avatarDecoration);
		load();
	} else {
		selectItemsId.value.push(decorationId);
	}
}

function openDecorationEdit(avatarDecoration) {
	os.popup(defineAsyncComponent(() => import('@/components/MkAvatarDecoEditDialog.vue')), {
		avatarDecoration: avatarDecoration,
	}, {
		del: () => {
			window.location.reload();
		},
	});
}

function openDecorationCreate() {
	os.popup(defineAsyncComponent(() => import('@/components/MkAvatarDecoEditDialog.vue')), {
	}, {
		del: result => {
			window.location.reload();
		},
	});
}

function load() {
	misskeyApi('admin/avatar-decorations/list').then(_avatarDecorations => {
		avatarDecorations.value = _avatarDecorations;
	});
}

load();
watch(select, () => {
	selectItemsId.value = [];
});

async function setCategoryBulk() {
	const { canceled, result } = await os.inputText({
		title: 'Category',
	});
	if (canceled) return;
	if (selectItemsId.value.length > 1) {
		for (let i = 0; i < selectItemsId.value.length; i++) {
			let decorationId = selectItemsId.value[i];
			await misskeyApi('admin/avatar-decorations/update', {
				id: decorationId,
				category: result,
			});
		}
	}
}

async function deletes() {
	const { canceled, result } = await os.inputText({
		title: 'Category',
	});
	if (canceled) return;
	if (selectItemsId.value.length > 1) {
		for (let i = 0; i < selectItemsId.value.length; i++) {
			let decorationId = selectItemsId.value[i];
			await misskeyApi('admin/avatar-decorations/delete', {
				id: decorationId,
				category: result,
			});
		}
	}
}

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.add,
	handler: openDecorationCreate,
}]);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.avatarDecorations,
	icon: 'ti ti-sparkles',
}));
</script>
<style module>
.decorations {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    grid-gap: 12px;
}
.selected{
			border: 0.1px solid var(--accent);
}
</style>
