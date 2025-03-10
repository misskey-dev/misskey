<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/profile" :label="i18n.ts.profile" :keywords="['profile']" icon="ti ti-user">
	<div class="_gaps_m">
		<div class="_panel">
			<div :class="$style.banner" :style="{ backgroundImage: $i.bannerUrl ? `url(${ $i.bannerUrl })` : null }">
				<div :class="$style.bannerEdit">
					<SearchMarker :keywords="['banner', 'change']">
						<MkButton primary rounded @click="changeBanner"><SearchLabel>{{ i18n.ts._profile.changeBanner }}</SearchLabel></MkButton>
					</SearchMarker>
				</div>
			</div>
			<div :class="$style.avatarContainer">
				<MkAvatar :class="$style.avatar" :user="$i" forceShowDecoration @click="changeAvatar"/>
				<div class="_buttonsCenter">
					<SearchMarker :keywords="['avatar', 'icon', 'change']">
						<MkButton primary rounded @click="changeAvatar"><SearchLabel>{{ i18n.ts._profile.changeAvatar }}</SearchLabel></MkButton>
					</SearchMarker>
					<MkButton primary rounded link to="/settings/avatar-decoration">{{ i18n.ts.decorate }} <i class="ti ti-sparkles"></i></MkButton>
				</div>
			</div>
		</div>

		<SearchMarker :keywords="['name']">
			<MkInput v-model="profile.name" :max="30" manualSave :mfmAutocomplete="['emoji']">
				<template #label><SearchLabel>{{ i18n.ts._profile.name }}</SearchLabel></template>
			</MkInput>
		</SearchMarker>

		<SearchMarker :keywords="['description', 'bio']">
			<MkTextarea v-model="profile.description" :max="500" tall manualSave mfmAutocomplete :mfmPreview="true">
				<template #label><SearchLabel>{{ i18n.ts._profile.description }}</SearchLabel></template>
				<template #caption>{{ i18n.ts._profile.youCanIncludeHashtags }}</template>
			</MkTextarea>
		</SearchMarker>

		<SearchMarker :keywords="['location', 'locale']">
			<MkInput v-model="profile.location" manualSave>
				<template #label><SearchLabel>{{ i18n.ts.location }}</SearchLabel></template>
				<template #prefix><i class="ti ti-map-pin"></i></template>
			</MkInput>
		</SearchMarker>

		<SearchMarker :keywords="['birthday', 'birthdate', 'age']">
			<MkInput v-model="profile.birthday" type="date" manualSave>
				<template #label><SearchLabel>{{ i18n.ts.birthday }}</SearchLabel></template>
				<template #prefix><i class="ti ti-cake"></i></template>
			</MkInput>
		</SearchMarker>

		<SearchMarker :keywords="['language', 'locale']">
			<MkSelect v-model="profile.lang">
				<template #label><SearchLabel>{{ i18n.ts.language }}</SearchLabel></template>
				<option v-for="x in Object.keys(langmap)" :key="x" :value="x">{{ langmap[x].nativeName }}</option>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['metadata']">
			<FormSlot>
				<MkFolder>
					<template #icon><i class="ti ti-list"></i></template>
					<template #label><SearchLabel>{{ i18n.ts._profile.metadataEdit }}</SearchLabel></template>
					<template #footer>
						<div class="_buttons">
							<MkButton primary @click="saveFields"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
							<MkButton :disabled="fields.length >= 16" @click="addField"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
							<MkButton v-if="!fieldEditMode" :disabled="fields.length <= 1" danger @click="fieldEditMode = !fieldEditMode"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
							<MkButton v-else @click="fieldEditMode = !fieldEditMode"><i class="ti ti-arrows-sort"></i> {{ i18n.ts.rearrange }}</MkButton>
						</div>
					</template>

					<div :class="$style.metadataRoot" class="_gaps_s">
						<MkInfo>{{ i18n.ts._profile.verifiedLinkDescription }}</MkInfo>

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
								<div v-panel :class="$style.fieldDragItem">
									<button v-if="!fieldEditMode" class="_button" :class="$style.dragItemHandle" tabindex="-1"><i class="ti ti-menu"></i></button>
									<button v-if="fieldEditMode" :disabled="fields.length <= 1" class="_button" :class="$style.dragItemRemove" @click="deleteField(index)"><i class="ti ti-x"></i></button>
									<div :class="$style.dragItemForm">
										<FormSplit :minWidth="200">
											<MkInput v-model="element.name" small :placeholder="i18n.ts._profile.metadataLabel">
											</MkInput>
											<MkInput v-model="element.value" small :placeholder="i18n.ts._profile.metadataContent">
											</MkInput>
										</FormSplit>
									</div>
								</div>
							</template>
						</Sortable>
					</div>
				</MkFolder>
				<template #caption>{{ i18n.ts._profile.metadataDescription }}</template>
			</FormSlot>
		</SearchMarker>

		<SearchMarker :keywords="['follow', 'message']">
			<MkInput v-model="profile.followedMessage" :max="200" manualSave :mfmPreview="false">
				<template #label><SearchLabel>{{ i18n.ts._profile.followedMessage }}</SearchLabel><span class="_beta">{{ i18n.ts.beta }}</span></template>
				<template #caption>
					<div><SearchKeyword>{{ i18n.ts._profile.followedMessageDescription }}</SearchKeyword></div>
					<div>{{ i18n.ts._profile.followedMessageDescriptionForLockedAccount }}</div>
				</template>
			</MkInput>
		</SearchMarker>

		<SearchMarker :keywords="['reaction']">
			<MkSelect v-model="reactionAcceptance">
				<template #label><SearchLabel>{{ i18n.ts.reactionAcceptance }}</SearchLabel></template>
				<option :value="null">{{ i18n.ts.all }}</option>
				<option value="likeOnlyForRemote">{{ i18n.ts.likeOnlyForRemote }}</option>
				<option value="nonSensitiveOnly">{{ i18n.ts.nonSensitiveOnly }}</option>
				<option value="nonSensitiveOnlyForLocalLikeOnlyForRemote">{{ i18n.ts.nonSensitiveOnlyForLocalLikeOnlyForRemote }}</option>
				<option value="likeOnly">{{ i18n.ts.likeOnly }}</option>
			</MkSelect>
		</SearchMarker>

		<SearchMarker>
			<MkFolder>
				<template #label><SearchLabel>{{ i18n.ts.advancedSettings }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['cat']">
						<MkSwitch v-model="profile.isCat">
							<template #label><SearchLabel>{{ i18n.ts.flagAsCat }}</SearchLabel></template>
							<template #caption>{{ i18n.ts.flagAsCatDescription }}</template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['bot']">
						<MkSwitch v-model="profile.isBot">
							<template #label><SearchLabel>{{ i18n.ts.flagAsBot }}</SearchLabel></template>
							<template #caption>{{ i18n.ts.flagAsBotDescription }}</template>
						</MkSwitch>
					</SearchMarker>
				</div>
			</MkFolder>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch, defineAsyncComponent } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSplit from '@/components/form/split.vue';
import MkFolder from '@/components/MkFolder.vue';
import FormSlot from '@/components/form/slot.vue';
import { selectFile } from '@/utility/select-file.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { signinRequired } from '@/account.js';
import { langmap } from '@/utility/langmap.js';
import { definePage } from '@/page.js';
import { claimAchievement } from '@/utility/achievements.js';
import { store } from '@/store.js';
import { globalEvents } from '@/events.js';
import MkInfo from '@/components/MkInfo.vue';
import MkTextarea from '@/components/MkTextarea.vue';

const $i = signinRequired();

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const reactionAcceptance = computed(store.makeGetterSetter('reactionAcceptance'));

function assertVaildLang(lang: string | null): lang is keyof typeof langmap {
	return lang != null && lang in langmap;
}

const profile = reactive({
	name: $i.name,
	description: $i.description,
	followedMessage: $i.followedMessage,
	location: $i.location,
	birthday: $i.birthday,
	lang: assertVaildLang($i.lang) ? $i.lang : null,
	isBot: $i.isBot ?? false,
	isCat: $i.isCat ?? false,
});

watch(() => profile, () => {
	save();
}, {
	deep: true,
});

const fields = ref($i.fields.map(field => ({ id: Math.random().toString(), name: field.name, value: field.value })) ?? []);
const fieldEditMode = ref(false);

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
	globalEvents.emit('requestClearPageCache');
}

function save() {
	os.apiWithDialog('i/update', {
		// 空文字列をnullにしたいので??は使うな
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		name: profile.name || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		description: profile.description || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		followedMessage: profile.followedMessage || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		location: profile.location || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		birthday: profile.birthday || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		lang: profile.lang || null,
		isBot: !!profile.isBot,
		isCat: !!profile.isCat,
	}, undefined, {
		'0b3f9f6a-2f4d-4b1f-9fb4-49d3a2fd7191': {
			title: i18n.ts.yourNameContainsProhibitedWords,
			text: i18n.ts.yourNameContainsProhibitedWordsDescription,
		},
	});
	globalEvents.emit('requestClearPageCache');
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
			text: i18n.ts.cropImageAsk,
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
		globalEvents.emit('requestClearPageCache');
		claimAchievement('profileFilled');
	});
}

function changeBanner(ev) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.banner).then(async (file) => {
		let originalOrCropped = file;

		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.ts.cropImageAsk,
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
		globalEvents.emit('requestClearPageCache');
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.profile,
	icon: 'ti ti-user',
}));
</script>

<style lang="scss" module>
.banner {
	position: relative;
	height: 130px;
	background-size: cover;
	background-position: center;
	border-bottom: solid 1px var(--MI_THEME-divider);
	overflow: clip;
}

.avatarContainer {
	margin-top: -50px;
	padding-bottom: 16px;
	text-align: center;
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

.fieldDragItem {
	display: flex;
	padding: 10px;
	align-items: flex-end;
	border-radius: 6px;

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
</style>
