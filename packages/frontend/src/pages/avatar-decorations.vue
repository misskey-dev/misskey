<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div v-if="tab === 'avatarDecorations'" class="_gaps">
			<MkFolder v-for="avatarDecoration in avatarDecorations" :key="avatarDecoration.id ?? avatarDecoration._id" :defaultOpen="avatarDecoration.id == null">
				<template #label>{{ avatarDecoration.name }}</template>
				<template #caption>{{ avatarDecoration.description }}</template>

				<div class="_gaps_m">
					<MkInput v-model="avatarDecoration.name">
						<template #label>{{ i18n.ts.name }}</template>
					</MkInput>
					<MkTextarea v-model="avatarDecoration.description">
						<template #label>{{ i18n.ts.description }}</template>
					</MkTextarea>
					<MkInput v-model="avatarDecoration.url">
						<template #label>{{ i18n.ts.imageUrl }}</template>
					</MkInput>
					<MkSwitch v-model="avatarDecoration.localOnly">
						<template #label>{{ i18n.ts.localOnly }}</template>
					</MkSwitch>
					<div class="buttons _buttons">
						<MkButton class="button" inline primary @click="save(avatarDecoration)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
						<MkButton v-if="avatarDecoration.id != null" class="button" inline danger @click="del(avatarDecoration)"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
					</div>
				</div>
			</MkFolder>
		</div>
		<div v-else-if="tab === 'avatarDecorationsAcceptHosts'">
			<MkTextarea v-model="acceptHosts">
				<span>{{ i18n.ts.avatarDecorationsAcceptInstance }}</span>
				<template #caption>{{ i18n.ts.avatarDecorationsAcceptInstancesDescription }}</template>
			</MkTextarea>
			<MkButton primary @click="acceptSave"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkFolder from '@/components/MkFolder.vue';

let avatarDecorations: any[] = $ref([]);
let tab = $ref('avatarDecorations');
let acceptHosts: string = $ref('');

function add() {
	avatarDecorations.unshift({
		_id: Math.random().toString(36),
		id: null,
		name: '',
		description: '',
		url: '',
	});
}

function del(avatarDecoration) {
	os.confirm({
		type: 'warning',
		text: i18n.t('deleteAreYouSure', { x: avatarDecoration.name }),
	}).then(({ canceled }) => {
		if (canceled) return;
		avatarDecorations = avatarDecorations.filter(x => x !== avatarDecoration);
		os.api('admin/avatar-decorations/delete', avatarDecoration);
	});
}

async function save(avatarDecoration) {
	if (avatarDecoration.id == null) {
		await os.apiWithDialog('admin/avatar-decorations/create', avatarDecoration);
		load();
	} else {
		os.apiWithDialog('admin/avatar-decorations/update', avatarDecoration);
	}
}

async function acceptSave() {
	await os.apiWithDialog('admin/update-meta', {
		avatarDecorationAcceptHosts: acceptHosts.split('\n') || [],
	});
}

function load() {
	os.api('admin/avatar-decorations/list').then(_avatarDecorations => {
		avatarDecorations = _avatarDecorations;
	});
	os.api('admin/meta').then(_meta => {
		acceptHosts = _meta.avatarDecorationAcceptHosts.join('\n');
	});
}

load();

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.add,
	handler: add,
}]);

const headerTabs = $computed(() => [{
	key: 'avatarDecorations',
	title: i18n.ts.avatarDecorations,
	icon: 'ti ti-sparkles',
}, {
	key: 'avatarDecorationsAcceptHosts',
	title: i18n.ts.avatarDecorationsAcceptInstance,
	icon: 'ti ti-thumb-up-filled',
}]);

definePageMetadata({
	title: i18n.ts.avatarDecorations,
	icon: 'ti ti-sparkles',
});
</script>
