<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
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
					<div class="buttons _buttons">
						<MkButton class="button" inline primary @click="save(avatarDecoration)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
						<MkButton v-if="avatarDecoration.id != null" class="button" inline danger @click="del(avatarDecoration)"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
					</div>
				</div>
			</MkFolder>
		</div>
		<!--
		<MkFolder>
			<template #label>ローカル</template>
			<div class="_gaps">
				<MkFolder v-for="localAvatarDecoration in localAvatarDecorations" :key="localAvatarDecoration.id ?? localAvatarDecoration._id" :defaultOpen="localAvatarDecoration.id == null">
					<template #label>{{ localAvatarDecoration.name }}</template>
					<template #caption>{{ localAvatarDecoration.description }}</template>
					<div class="_gaps_m">
						<MkInput v-model="localAvatarDecoration.name">
							<template #label>{{ i18n.ts.name }}</template>
						</MkInput>
						<MkTextarea v-model="localAvatarDecoration.description">
							<template #label>{{ i18n.ts.description }}</template>
						</MkTextarea>
						<MkInput v-model="localAvatarDecoration.url">
							<template #label>{{ i18n.ts.imageUrl }}</template>
						</MkInput>
						<div class="buttons _buttons">
							<MkButton class="button" inline primary @click="save(localAvatarDecoration)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
							<MkButton v-if="localAvatarDecoration.id != null" class="button" inline danger @click="del(localAvatarDecoration)"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
						</div>
					</div>
				</MkFolder>
			</div>
		</MkFolder>
		<br>
		<MkFolder>
			<template #label>リモート</template>
			<div class="_gaps">
				<MkFolder v-for="remoteAvatarDecoration in remoteAvatarDecorations" :key="remoteAvatarDecoration.id ?? remoteAvatarDecoration._id" :defaultOpen="remoteAvatarDecoration.id == null">
					<template #label>{{ remoteAvatarDecoration.name }}</template>
					<template #caption>{{ remoteAvatarDecoration.description }}</template>
					<div class="_gaps_m">
						<MkInput v-model="remoteAvatarDecoration.name">
							<template #label>{{ i18n.ts.name }}</template>
						</MkInput>
						<MkTextarea v-model="remoteAvatarDecoration.description">
							<template #label>{{ i18n.ts.description }}</template>
						</MkTextarea>
						<MkInput v-model="remoteAvatarDecoration.url">
							<template #label>{{ i18n.ts.imageUrl }}</template>
						</MkInput>
						<div class="buttons _buttons">
							<MkButton class="button" inline primary @click="save(remoteAvatarDecoration)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
							<MkButton v-if="remoteAvatarDecoration.id != null" class="button" inline danger @click="del(remoteAvatarDecoration)"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
						</div>
					</div>
				</MkFolder>
			</div>
		</MkFolder>
		-->
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkFolder from '@/components/MkFolder.vue';

const avatarDecorations = ref<Misskey.entities.AdminAvatarDecorationsListResponse>([]);
const localAvatarDecorations = ref<Misskey.entities.AdminAvatarDecorationsListResponse>([]);
const remoteAvatarDecorations = ref<Misskey.entities.AdminAvatarDecorationsListResponse>([]);

function add() {
	avatarDecorations.value.unshift({
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
		avatarDecorations.value = avatarDecorations.value.filter(x => x !== avatarDecoration);
		misskeyApi('admin/avatar-decorations/delete', avatarDecoration);
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

function load() {
	misskeyApi('admin/avatar-decorations/list').then(_avatarDecorations => {
		avatarDecorations.value = _avatarDecorations;
		_avatarDecorations.forEach(item => {
			if (item.name.includes('import_')) {
				remoteAvatarDecorations.value.push(item);
			} else {
				localAvatarDecorations.value.push(item);
			}
		});
	},
	);
}

load();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.add,
	handler: add,
}]);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.avatarDecorations,
	icon: 'ti ti-sparkles',
});
</script>
