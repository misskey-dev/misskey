<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<div :class="$style.avatarAndBanner" :style="{ backgroundImage: $i.bannerUrl ? `url(${ $i.bannerUrl })` : null }">
		<div :class="$style.avatarContainer">
			<MkAvatar :class="$style.avatar" :user="$i" forceShowDecoration @click="changeAvatar"/>
			<MkButton primary rounded @click="changeAvatar">{{ i18n.ts._profile.changeAvatar }}</MkButton>
		</div>
		<MkButton primary rounded :class="$style.bannerEdit" @click="changeBanner">{{ i18n.ts._profile.changeBanner }}</MkButton>
	</div>

	<MkInput v-model="profile.name" :max="30" manualSave>
		<template #label>{{ i18n.ts._profile.name }}</template>
	</MkInput>

	<MkTextarea v-model="profile.description" :max="500" tall manualSave>
		<template #label>{{ i18n.ts._profile.description }}</template>
		<template #caption>{{ i18n.ts._profile.youCanIncludeHashtags }}</template>
	</MkTextarea>

	<MkInput v-model="profile.location" manualSave>
		<template #label>{{ i18n.ts.location }}</template>
		<template #prefix><i class="ti ti-map-pin"></i></template>
	</MkInput>

	<MkInput v-model="profile.birthday" type="date" manualSave>
		<template #label>{{ i18n.ts.birthday }}</template>
		<template #prefix><i class="ti ti-cake"></i></template>
	</MkInput>

	<MkSelect v-model="profile.lang">
		<template #label>{{ i18n.ts.language }}</template>
		<option v-for="x in Object.keys(langmap)" :key="x" :value="x">{{ langmap[x].nativeName }}</option>
	</MkSelect>

	<FormSlot>
		<MkFolder>
			<template #icon><i class="ti ti-list"></i></template>
			<template #label>{{ i18n.ts._profile.metadataEdit }}</template>

			<div :class="$style.metadataRoot">
				<div :class="$style.metadataMargin">
					<MkButton :disabled="fields.length >= 16" inline style="margin-right: 8px;" @click="addField"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
					<MkButton v-if="!fieldEditMode" :disabled="fields.length <= 1" inline danger style="margin-right: 8px;" @click="fieldEditMode = !fieldEditMode"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
					<MkButton v-else inline style="margin-right: 8px;" @click="fieldEditMode = !fieldEditMode"><i class="ti ti-arrows-sort"></i> {{ i18n.ts.rearrange }}</MkButton>
					<MkButton inline primary @click="saveFields"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
				</div>

				<Sortable
					v-model="fields"
					class="_gaps_s"
					itemKey="id"
					:animation="150"
					:handle="'.' + $style.dragItemHandle"
					@start="e => e.item.classList.add('active')"
					@end="e => e.item.classList.remove('active')"
				>
					<template #item="{element, index}">
						<div :class="$style.fieldDragItem">
							<button v-if="!fieldEditMode" class="_button" :class="$style.dragItemHandle" tabindex="-1"><i class="ti ti-menu"></i></button>
							<button v-if="fieldEditMode" :disabled="fields.length <= 1" class="_button" :class="$style.dragItemRemove" @click="deleteField(index)"><i class="ti ti-x"></i></button>
							<div :class="$style.dragItemForm">
								<FormSplit :minWidth="200">
									<MkInput v-model="element.name" small>
										<template #label>{{ i18n.ts._profile.metadataLabel }}</template>
									</MkInput>
									<MkInput v-model="element.value" small>
										<template #label>{{ i18n.ts._profile.metadataContent }}</template>
									</MkInput>
								</FormSplit>
							</div>
						</div>
					</template>
				</Sortable>

				<MkInfo>{{ i18n.ts._profile.verifiedLinkDescription }}</MkInfo>
			</div>
		</MkFolder>
		<template #caption>{{ i18n.ts._profile.metadataDescription }}</template>
	</FormSlot>

	<MkFolder>
		<template #icon><i class="ti ti-sparkles"></i></template>
		<template #label>{{ i18n.ts.avatarDecorations }}</template>

		<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); grid-gap: 12px;">
			<div
				v-for="avatarDecoration in avatarDecorations"
				:key="avatarDecoration.id"
				:class="[$style.avatarDecoration, { [$style.avatarDecorationActive]: $i.avatarDecorations.some(x => x.id === avatarDecoration.id) }]"
				@click="openDecoration(avatarDecoration)"
			>
				<div :class="$style.avatarDecorationName"><MkCondensedLine :minScale="0.5">{{ avatarDecoration.name }}</MkCondensedLine></div>
				<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decoration="{ url: avatarDecoration.url }" forceShowDecoration/>
				<i v-if="avatarDecoration.roleIdsThatCanBeUsedThisDecoration.length > 0 && !$i.roles.some(r => avatarDecoration.roleIdsThatCanBeUsedThisDecoration.includes(r.id))" :class="$style.avatarDecorationLock" class="ti ti-lock"></i>
			</div>
		</div>
	</MkFolder>

	<MkFolder>
		<template #label>{{ i18n.ts.advancedSettings }}</template>

		<div class="_gaps_m">
			<MkSwitch v-model="profile.isCat">{{ i18n.ts.flagAsCat }}<template #caption>{{ i18n.ts.flagAsCatDescription }}</template></MkSwitch>
			<MkSwitch v-model="profile.isBot">{{ i18n.ts.flagAsBot }}<template #caption>{{ i18n.ts.flagAsBotDescription }}</template></MkSwitch>
		</div>
	</MkFolder>

	<MkSelect v-model="reactionAcceptance">
		<template #label>{{ i18n.ts.reactionAcceptance }}</template>
		<option :value="null">{{ i18n.ts.all }}</option>
		<option value="likeOnlyForRemote">{{ i18n.ts.likeOnlyForRemote }}</option>
		<option value="nonSensitiveOnly">{{ i18n.ts.nonSensitiveOnly }}</option>
		<option value="nonSensitiveOnlyForLocalLikeOnlyForRemote">{{ i18n.ts.nonSensitiveOnlyForLocalLikeOnlyForRemote }}</option>
		<option value="likeOnly">{{ i18n.ts.likeOnly }}</option>
	</MkSelect>
</div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch, defineAsyncComponent, onMounted, onUnmounted } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSplit from '@/components/form/split.vue';
import MkFolder from '@/components/MkFolder.vue';
import FormSlot from '@/components/form/slot.vue';
import { selectFile } from '@/scripts/select-file.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import { langmap } from '@/scripts/langmap.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { claimAchievement } from '@/scripts/achievements.js';
import { defaultStore } from '@/store.js';
import MkInfo from '@/components/MkInfo.vue';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const reactionAcceptance = computed(defaultStore.makeGetterSetter('reactionAcceptance'));
let avatarDecorations: any[] = $ref([]);

const profile = reactive({
	name: $i.name,
	description: $i.description,
	location: $i.location,
	birthday: $i.birthday,
	lang: $i.lang,
	isBot: $i.isBot,
	isCat: $i.isCat,
});

watch(() => profile, () => {
	save();
}, {
	deep: true,
});

const fields = ref($i?.fields.map(field => ({ id: Math.random().toString(), name: field.name, value: field.value })) ?? []);
const fieldEditMode = ref(false);

os.api('get-avatar-decorations').then(_avatarDecorations => {
	avatarDecorations = _avatarDecorations;
});

function addField() {
	fields.value.push({
		id: Math.random().toString(),
		name: '',
		value: '',
	});
}

while (fields.value.length < 4) {
	addField();
}

function deleteField(index: number) {
	fields.value.splice(index, 1);
}

function saveFields() {
	os.apiWithDialog('i/update', {
		fields: fields.value.filter(field => field.name !== '' && field.value !== '').map(field => ({ name: field.name, value: field.value })),
	});
}

function save() {
	os.apiWithDialog('i/update', {
		// 空文字列をnullにしたいので??は使うな
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		name: profile.name || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		description: profile.description || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		location: profile.location || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		birthday: profile.birthday || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		lang: profile.lang || null,
		isBot: !!profile.isBot,
		isCat: !!profile.isCat,
	});
	claimAchievement('profileFilled');
	if (profile.name === 'syuilo' || profile.name === 'しゅいろ') {
		claimAchievement('setNameToSyuilo');
	}
	if (profile.isCat) {
		claimAchievement('markedAsCat');
	}
}

function changeAvatar(ev) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.avatar).then(async (file) => {
		let originalOrCropped = file;

		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.t('cropImageAsk'),
			okText: i18n.ts.cropYes,
			cancelText: i18n.ts.cropNo,
		});

		if (!canceled) {
			originalOrCropped = await os.cropImage(file, {
				aspectRatio: 1,
			});
		}

		const i = await os.apiWithDialog('i/update', {
			avatarId: originalOrCropped.id,
		});
		$i.avatarId = i.avatarId;
		$i.avatarUrl = i.avatarUrl;
		claimAchievement('profileFilled');
	});
}

function changeBanner(ev) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.banner).then(async (file) => {
		let originalOrCropped = file;

		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.t('cropImageAsk'),
			okText: i18n.ts.cropYes,
			cancelText: i18n.ts.cropNo,
		});

		if (!canceled) {
			originalOrCropped = await os.cropImage(file, {
				aspectRatio: 2,
			});
		}

		const i = await os.apiWithDialog('i/update', {
			bannerId: originalOrCropped.id,
		});
		$i.bannerId = i.bannerId;
		$i.bannerUrl = i.bannerUrl;
	});
}

function openDecoration(avatarDecoration) {
	os.popup(defineAsyncComponent(() => import('./profile.avatar-decoration-dialog.vue')), {
		decoration: avatarDecoration,
	}, {}, 'closed');
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.profile,
	icon: 'ti ti-user',
});
</script>

<style lang="scss" module>
.avatarAndBanner {
	position: relative;
	background-size: cover;
	background-position: center;
	border: solid 1px var(--divider);
	border-radius: 10px;
	overflow: clip;
}

.avatarContainer {
	display: inline-block;
	text-align: center;
	padding: 16px;
}

.avatar {
	display: inline-block;
	width: 72px;
	height: 72px;
	margin: 0 auto 16px auto;
}

.bannerEdit {
	position: absolute;
	top: 16px;
	right: 16px;
}

.metadataRoot {
	container-type: inline-size;
}

.metadataMargin {
	margin-bottom: 1.5em;
}

.fieldDragItem {
	display: flex;
	padding-bottom: .75em;
	align-items: flex-end;
	border-bottom: solid 0.5px var(--divider);

	&:last-child {
		border-bottom: 0;
	}

	/* (drag button) 32px + (drag button margin) 8px + (input width) 200px * 2 + (input gap) 12px = 452px */
	@container (max-width: 452px) {
		align-items: center;
	}
}

.dragItemHandle {
	cursor: grab;
	width: 32px;
	height: 32px;
	margin: 0 8px 0 0;
	opacity: 0.5;
	flex-shrink: 0;

	&:active {
		cursor: grabbing;
	}
}

.dragItemRemove {
	@extend .dragItemHandle;

	color: #ff2a2a;
	opacity: 1;
	cursor: pointer;

	&:hover, &:focus {
		opacity: .7;
	}
	&:active {
		cursor: pointer;
	}
}

.dragItemForm {
	flex-grow: 1;
}

.avatarDecoration {
	cursor: pointer;
	padding: 16px 16px 28px 16px;
	border: solid 2px var(--divider);
	border-radius: 8px;
	text-align: center;
	font-size: 90%;
	overflow: clip;
	contain: content;
}

.avatarDecorationActive {
	background-color: var(--accentedBg);
	border-color: var(--accent);
}

.avatarDecorationName {
	position: relative;
	z-index: 10;
	font-weight: bold;
	margin-bottom: 20px;
}

.avatarDecorationLock {
	position: absolute;
	bottom: 12px;
	right: 12px;
}
</style>
