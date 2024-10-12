<!--
SPDX-FileCopyrightText: syuilo and misskey-project
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

				<div :class="$style.editorRoot">
					<div :class="$style.editorWrapper">
						<div :class="$style.preview">
							<div :class="[$style.previewItem, $style.light]">
								<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="[avatarDecoration]" forceShowDecoration/>
							</div>
							<div :class="[$style.previewItem, $style.dark]">
								<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="[avatarDecoration]" forceShowDecoration/>
							</div>
						</div>
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
							<div class="_buttons">
								<MkButton inline primary @click="save(avatarDecoration)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
								<MkButton v-if="avatarDecoration.id != null" inline danger @click="del(avatarDecoration)"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
							</div>
						</div>
					</div>
				</div>
			</MkFolder>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import { signinRequired } from '@/account.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkFolder from '@/components/MkFolder.vue';

const avatarDecorations = ref<Misskey.entities.AdminAvatarDecorationsListResponse>([]);

const $i = signinRequired();

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
		os.apiWithDialog('admin/avatar-decorations/update', avatarDecoration);
	}
}

function load() {
	misskeyApi('admin/avatar-decorations/list').then(_avatarDecorations => {
		avatarDecorations.value = _avatarDecorations;
	});
}

load();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.add,
	handler: add,
}]);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.avatarDecorations,
	icon: 'ti ti-sparkles',
}));
</script>

<style lang="scss" module>
.editorRoot {
	container: editor / inline-size;
}

.editorWrapper {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: auto auto;
	gap: var(--MI-margin);
}

.preview {
	display: grid;
	place-items: center;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 1fr;
	gap: var(--MI-margin);
}

.previewItem {
	width: 100%;
	height: 100%;
	min-height: 160px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--MI-radius);

	&.light {
		background: #eee;
	}

	&.dark {
		background: #222;
	}
}

@container editor (min-width: 600px) {
	.editorWrapper {
		grid-template-columns: 200px 1fr;
		grid-template-rows: 1fr;
		gap: calc(var(--MI-margin) * 2);
	}

	.preview {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}
}
</style>
