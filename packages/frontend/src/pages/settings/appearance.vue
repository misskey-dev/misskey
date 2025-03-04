<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/appearance" :label="i18n.ts.appearance" :keywords="['appearance']" icon="ti ti-device-desktop">
	<div class="_gaps_m">
		<FormSection first>
			<div class="_gaps_m">
				<div class="_gaps_s">
					<SearchMarker :keywords="['blur']">
						<MkSwitch v-model="useBlurEffect">
							<template #label><SearchLabel>{{ i18n.ts.useBlurEffect }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['blur', 'modal']">
						<MkSwitch v-model="useBlurEffectForModal">
							<template #label><SearchLabel>{{ i18n.ts.useBlurEffectForModal }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['highlight', 'sensitive', 'nsfw', 'image', 'photo', 'picture', 'media', 'thumbnail']">
						<MkSwitch v-model="highlightSensitiveMedia">
							<template #label><SearchLabel>{{ i18n.ts.highlightSensitiveMedia }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['avatar', 'icon', 'square']">
						<MkSwitch v-model="squareAvatars">
							<template #label><SearchLabel>{{ i18n.ts.squareAvatars }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['avatar', 'icon', 'decoration', 'show']">
						<MkSwitch v-model="showAvatarDecorations">
							<template #label><SearchLabel>{{ i18n.ts.showAvatarDecorations }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['note', 'timeline', 'gap']">
						<MkSwitch v-model="showGapBetweenNotesInTimeline">
							<template #label><SearchLabel>{{ i18n.ts.showGapBetweenNotesInTimeline }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['font', 'system', 'native']">
						<MkSwitch v-model="useSystemFont">
							<template #label><SearchLabel>{{ i18n.ts.useSystemFont }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['effect', 'show']">
						<MkSwitch v-model="enableSeasonalScreenEffect">
							<template #label><SearchLabel>{{ i18n.ts.seasonalScreenEffect }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>
				</div>

				<SearchMarker :keywords="['menu', 'style', 'popup', 'drawer']">
					<MkSelect v-model="menuStyle">
						<template #label><SearchLabel>{{ i18n.ts.menuStyle }}</SearchLabel></template>
						<option value="auto">{{ i18n.ts.auto }}</option>
						<option value="popup">{{ i18n.ts.popup }}</option>
						<option value="drawer">{{ i18n.ts.drawer }}</option>
					</MkSelect>
				</SearchMarker>

				<SearchMarker :keywords="['emoji', 'style', 'native', 'system', 'fluent', 'twemoji']">
					<div>
						<MkRadios v-model="emojiStyle">
							<template #label><SearchLabel>{{ i18n.ts.emojiStyle }}</SearchLabel></template>
							<option value="native">{{ i18n.ts.native }}</option>
							<option value="fluentEmoji">Fluent Emoji</option>
							<option value="twemoji">Twemoji</option>
						</MkRadios>
						<div style="margin: 8px 0 0 0; font-size: 1.5em;"><Mfm :key="emojiStyle" text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></div>
					</div>
				</SearchMarker>

				<SearchMarker :keywords="['font', 'size']">
					<MkRadios v-model="fontSize">
						<template #label><SearchLabel>{{ i18n.ts.fontSize }}</SearchLabel></template>
						<option :value="null"><span style="font-size: 14px;">Aa</span></option>
						<option value="1"><span style="font-size: 15px;">Aa</span></option>
						<option value="2"><span style="font-size: 16px;">Aa</span></option>
						<option value="3"><span style="font-size: 17px;">Aa</span></option>
					</MkRadios>
				</SearchMarker>
			</div>
		</FormSection>

		<SearchMarker :keywords="['note', 'display']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.displayOfNote }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['reaction', 'size', 'scale', 'display']">
						<MkRadios v-model="reactionsDisplaySize">
							<template #label><SearchLabel>{{ i18n.ts.reactionsDisplaySize }}</SearchLabel></template>
							<option value="small">{{ i18n.ts.small }}</option>
							<option value="medium">{{ i18n.ts.medium }}</option>
							<option value="large">{{ i18n.ts.large }}</option>
						</MkRadios>
					</SearchMarker>

					<SearchMarker :keywords="['reaction', 'size', 'scale', 'display', 'width', 'limit']">
						<MkSwitch v-model="limitWidthOfReaction">
							<template #label><SearchLabel>{{ i18n.ts.limitWidthOfReaction }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['attachment', 'image', 'photo', 'picture', 'media', 'thumbnail', 'list', 'size', 'height']">
						<MkRadios v-model="mediaListWithOneImageAppearance">
							<template #label><SearchLabel>{{ i18n.ts.mediaListWithOneImageAppearance }}</SearchLabel></template>
							<option value="expand">{{ i18n.ts.default }}</option>
							<option value="16_9">{{ i18n.tsx.limitTo({ x: '16:9' }) }}</option>
							<option value="1_1">{{ i18n.tsx.limitTo({ x: '1:1' }) }}</option>
							<option value="2_3">{{ i18n.tsx.limitTo({ x: '2:3' }) }}</option>
						</MkRadios>
					</SearchMarker>

					<SearchMarker :keywords="['ticker', 'information', 'label', 'instance', 'server', 'host', 'federation']">
						<MkSelect v-if="instance.federation !== 'none'" v-model="instanceTicker">
							<template #label><SearchLabel>{{ i18n.ts.instanceTicker }}</SearchLabel></template>
							<option value="none">{{ i18n.ts._instanceTicker.none }}</option>
							<option value="remote">{{ i18n.ts._instanceTicker.remote }}</option>
							<option value="always">{{ i18n.ts._instanceTicker.always }}</option>
						</MkSelect>
					</SearchMarker>

					<SearchMarker :keywords="['attachment', 'image', 'photo', 'picture', 'media', 'thumbnail', 'nsfw', 'sensitive', 'display', 'show', 'hide', 'visibility']">
						<MkSelect v-model="nsfw">
							<template #label><SearchLabel>{{ i18n.ts.displayOfSensitiveMedia }}</SearchLabel></template>
							<option value="respect">{{ i18n.ts._displayOfSensitiveMedia.respect }}</option>
							<option value="ignore">{{ i18n.ts._displayOfSensitiveMedia.ignore }}</option>
							<option value="force">{{ i18n.ts._displayOfSensitiveMedia.force }}</option>
						</MkSelect>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['notification', 'display']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.notificationDisplay }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['position']">
						<MkRadios v-model="notificationPosition">
							<template #label><SearchLabel>{{ i18n.ts.position }}</SearchLabel></template>
							<option value="leftTop"><i class="ti ti-align-box-left-top"></i> {{ i18n.ts.leftTop }}</option>
							<option value="rightTop"><i class="ti ti-align-box-right-top"></i> {{ i18n.ts.rightTop }}</option>
							<option value="leftBottom"><i class="ti ti-align-box-left-bottom"></i> {{ i18n.ts.leftBottom }}</option>
							<option value="rightBottom"><i class="ti ti-align-box-right-bottom"></i> {{ i18n.ts.rightBottom }}</option>
						</MkRadios>
					</SearchMarker>

					<SearchMarker :keywords="['stack', 'axis', 'direction']">
						<MkRadios v-model="notificationStackAxis">
							<template #label><SearchLabel>{{ i18n.ts.stackAxis }}</SearchLabel></template>
							<option value="vertical"><i class="ti ti-carousel-vertical"></i> {{ i18n.ts.vertical }}</option>
							<option value="horizontal"><i class="ti ti-carousel-horizontal"></i> {{ i18n.ts.horizontal }}</option>
						</MkRadios>
					</SearchMarker>

					<MkButton @click="testNotification">{{ i18n.ts._notification.checkNotificationBehavior }}</MkButton>
				</div>
			</FormSection>
		</SearchMarker>

		<FormSection>
			<FormLink to="/settings/custom-css"><template #icon><i class="ti ti-code"></i></template>{{ i18n.ts.customCss }}</FormLink>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkRadios from '@/components/MkRadios.vue';
import { defaultStore } from '@/store.js';
import { reloadAsk } from '@/scripts/reload-ask.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { miLocalStorage } from '@/local-storage.js';
import FormLink from '@/components/form/link.vue';
import { globalEvents } from '@/events.js';
import { claimAchievement } from '@/scripts/achievements.js';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import { instance } from '@/instance.js';

const fontSize = ref(miLocalStorage.getItem('fontSize'));
const useSystemFont = ref(miLocalStorage.getItem('useSystemFont') != null);

const showAvatarDecorations = computed(defaultStore.makeGetterSetter('showAvatarDecorations'));
const emojiStyle = computed(defaultStore.makeGetterSetter('emojiStyle'));
const menuStyle = computed(defaultStore.makeGetterSetter('menuStyle'));
const useBlurEffectForModal = computed(defaultStore.makeGetterSetter('useBlurEffectForModal'));
const useBlurEffect = computed(defaultStore.makeGetterSetter('useBlurEffect'));
const highlightSensitiveMedia = computed(defaultStore.makeGetterSetter('highlightSensitiveMedia'));
const squareAvatars = computed(defaultStore.makeGetterSetter('squareAvatars'));
const enableSeasonalScreenEffect = computed(defaultStore.makeGetterSetter('enableSeasonalScreenEffect'));
const showGapBetweenNotesInTimeline = computed(defaultStore.makeGetterSetter('showGapBetweenNotesInTimeline'));
const mediaListWithOneImageAppearance = computed(defaultStore.makeGetterSetter('mediaListWithOneImageAppearance'));
const reactionsDisplaySize = computed(defaultStore.makeGetterSetter('reactionsDisplaySize'));
const limitWidthOfReaction = computed(defaultStore.makeGetterSetter('limitWidthOfReaction'));
const notificationPosition = computed(defaultStore.makeGetterSetter('notificationPosition'));
const notificationStackAxis = computed(defaultStore.makeGetterSetter('notificationStackAxis'));
const nsfw = computed(defaultStore.makeGetterSetter('nsfw'));
const instanceTicker = computed(defaultStore.makeGetterSetter('instanceTicker'));

watch(fontSize, () => {
	if (fontSize.value == null) {
		miLocalStorage.removeItem('fontSize');
	} else {
		miLocalStorage.setItem('fontSize', fontSize.value);
	}
});

watch(useSystemFont, () => {
	if (useSystemFont.value) {
		miLocalStorage.setItem('useSystemFont', 't');
	} else {
		miLocalStorage.removeItem('useSystemFont');
	}
});

watch([
	fontSize,
	useSystemFont,
	squareAvatars,
	highlightSensitiveMedia,
	enableSeasonalScreenEffect,
	showGapBetweenNotesInTimeline,
	mediaListWithOneImageAppearance,
	reactionsDisplaySize,
	limitWidthOfReaction,
	mediaListWithOneImageAppearance,
	reactionsDisplaySize,
	limitWidthOfReaction,
	instanceTicker,
], async () => {
	await reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

let smashCount = 0;
let smashTimer: number | null = null;

function testNotification(): void {
	const notification: Misskey.entities.Notification = {
		id: Math.random().toString(),
		createdAt: new Date().toUTCString(),
		isRead: false,
		type: 'test',
	};

	globalEvents.emit('clientNotification', notification);

	// セルフ通知破壊 実績関連
	smashCount++;
	if (smashCount >= 10) {
		claimAchievement('smashTestNotificationButton');
		smashCount = 0;
	}
	if (smashTimer) {
		clearTimeout(smashTimer);
	}
	smashTimer = window.setTimeout(() => {
		smashCount = 0;
	}, 300);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.appearance,
	icon: 'ti ti-device-desktop',
}));
</script>
