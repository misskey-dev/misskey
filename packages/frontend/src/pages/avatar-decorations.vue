<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
			<div :class="$style.decorations">
				<XDecoration
					v-for="avatarDecoration in avatarDecorations"
					:key="avatarDecoration.id"
					:decoration="avatarDecoration"
					@click="openDecorationEdit(avatarDecoration)"
				/>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import XDecoration from '@/pages/settings/avatar-decoration.decoration.vue';

const avatarDecorations = ref<Misskey.entities.AdminAvatarDecorationsListResponse>([]);

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
	os.api('admin/avatar-decorations/list').then(_avatarDecorations => {
		avatarDecorations.value = _avatarDecorations;
	});
}

load();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.add,
	handler: openDecorationCreate,
}]);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.avatarDecorations,
	icon: 'ti ti-sparkles',
});
</script>
<style module>
.decorations {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    grid-gap: 12px;
}
</style>
