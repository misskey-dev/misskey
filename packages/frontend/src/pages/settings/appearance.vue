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
						<MkPreferenceContainer k="useBlurEffect">
							<MkSwitch v-model="useBlurEffect">
								<template #label><SearchLabel>{{ i18n.ts.useBlurEffect }}</SearchLabel></template>
							</MkSwitch>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['blur', 'modal']">
						<MkPreferenceContainer k="useBlurEffectForModal">
							<MkSwitch v-model="useBlurEffectForModal">
								<template #label><SearchLabel>{{ i18n.ts.useBlurEffectForModal }}</SearchLabel></template>
							</MkSwitch>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['highlight', 'sensitive', 'nsfw', 'image', 'photo', 'picture', 'media', 'thumbnail']">
						<MkPreferenceContainer k="highlightSensitiveMedia">
							<MkSwitch v-model="highlightSensitiveMedia">
								<template #label><SearchLabel>{{ i18n.ts.highlightSensitiveMedia }}</SearchLabel></template>
							</MkSwitch>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['avatar', 'icon', 'square']">
						<MkPreferenceContainer k="squareAvatars">
							<MkSwitch v-model="squareAvatars">
								<template #label><SearchLabel>{{ i18n.ts.squareAvatars }}</SearchLabel></template>
							</MkSwitch>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['avatar', 'icon', 'decoration', 'show']">
						<MkPreferenceContainer k="showAvatarDecorations">
							<MkSwitch v-model="showAvatarDecorations">
								<template #label><SearchLabel>{{ i18n.ts.showAvatarDecorations }}</SearchLabel></template>
							</MkSwitch>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['note', 'timeline', 'gap']">
						<MkPreferenceContainer k="showGapBetweenNotesInTimeline">
							<MkSwitch v-model="showGapBetweenNotesInTimeline">
								<template #label><SearchLabel>{{ i18n.ts.showGapBetweenNotesInTimeline }}</SearchLabel></template>
							</MkSwitch>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['effect', 'show']">
						<MkPreferenceContainer k="enableSeasonalScreenEffect">
							<MkSwitch v-model="enableSeasonalScreenEffect">
								<template #label><SearchLabel>{{ i18n.ts.seasonalScreenEffect }}</SearchLabel></template>
							</MkSwitch>
						</MkPreferenceContainer>
					</SearchMarker>
				</div>

				<SearchMarker :keywords="['menu', 'style', 'popup', 'drawer']">
					<MkPreferenceContainer k="menuStyle">
						<MkSelect v-model="menuStyle">
							<template #label><SearchLabel>{{ i18n.ts.menuStyle }}</SearchLabel></template>
							<option value="auto">{{ i18n.ts.auto }}</option>
							<option value="popup">{{ i18n.ts.popup }}</option>
							<option value="drawer">{{ i18n.ts.drawer }}</option>
						</MkSelect>
					</MkPreferenceContainer>
				</SearchMarker>

				<SearchMarker :keywords="['emoji', 'style', 'native', 'system', 'fluent', 'twemoji']">
					<MkPreferenceContainer k="emojiStyle">
						<div>
							<MkRadios v-model="emojiStyle">
								<template #label><SearchLabel>{{ i18n.ts.emojiStyle }}</SearchLabel></template>
								<option value="native">{{ i18n.ts.native }}</option>
								<option value="fluentEmoji">Fluent Emoji</option>
								<option value="twemoji">Twemoji</option>
							</MkRadios>
							<div style="margin: 8px 0 0 0; font-size: 1.5em;"><Mfm :key="emojiStyle" text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></div>
						</div>
					</MkPreferenceContainer>
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

				<SearchMarker :keywords="['font', 'system', 'native']">
					<MkSwitch v-model="useSystemFont">
						<template #label><SearchLabel>{{ i18n.ts.useSystemFont }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>
			</div>
		</FormSection>

		<SearchMarker :keywords="['note', 'display']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.displayOfNote }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['reaction', 'size', 'scale', 'display']">
						<MkPreferenceContainer k="reactionsDisplaySize">
							<MkRadios v-model="reactionsDisplaySize">
								<template #label><SearchLabel>{{ i18n.ts.reactionsDisplaySize }}</SearchLabel></template>
								<option value="small">{{ i18n.ts.small }}</option>
								<option value="medium">{{ i18n.ts.medium }}</option>
								<option value="large">{{ i18n.ts.large }}</option>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['reaction', 'size', 'scale', 'display', 'width', 'limit']">
						<MkPreferenceContainer k="limitWidthOfReaction">
							<MkSwitch v-model="limitWidthOfReaction">
								<template #label><SearchLabel>{{ i18n.ts.limitWidthOfReaction }}</SearchLabel></template>
							</MkSwitch>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['attachment', 'image', 'photo', 'picture', 'media', 'thumbnail', 'list', 'size', 'height']">
						<MkPreferenceContainer k="mediaListWithOneImageAppearance">
							<MkRadios v-model="mediaListWithOneImageAppearance">
								<template #label><SearchLabel>{{ i18n.ts.mediaListWithOneImageAppearance }}</SearchLabel></template>
								<option value="expand">{{ i18n.ts.default }}</option>
								<option value="16_9">{{ i18n.tsx.limitTo({ x: '16:9' }) }}</option>
								<option value="1_1">{{ i18n.tsx.limitTo({ x: '1:1' }) }}</option>
								<option value="2_3">{{ i18n.tsx.limitTo({ x: '2:3' }) }}</option>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['ticker', 'information', 'label', 'instance', 'server', 'host', 'federation']">
						<MkPreferenceContainer k="instanceTicker">
							<MkSelect v-if="instance.federation !== 'none'" v-model="instanceTicker">
								<template #label><SearchLabel>{{ i18n.ts.instanceTicker }}</SearchLabel></template>
								<option value="none">{{ i18n.ts._instanceTicker.none }}</option>
								<option value="remote">{{ i18n.ts._instanceTicker.remote }}</option>
								<option value="always">{{ i18n.ts._instanceTicker.always }}</option>
							</MkSelect>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['attachment', 'image', 'photo', 'picture', 'media', 'thumbnail', 'nsfw', 'sensitive', 'display', 'show', 'hide', 'visibility']">
						<MkPreferenceContainer k="nsfw">
							<MkSelect v-model="nsfw">
								<template #label><SearchLabel>{{ i18n.ts.displayOfSensitiveMedia }}</SearchLabel></template>
								<option value="respect">{{ i18n.ts._displayOfSensitiveMedia.respect }}</option>
								<option value="ignore">{{ i18n.ts._displayOfSensitiveMedia.ignore }}</option>
								<option value="force">{{ i18n.ts._displayOfSensitiveMedia.force }}</option>
							</MkSelect>
						</MkPreferenceContainer>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['notification', 'display']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.notificationDisplay }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['position']">
						<MkPreferenceContainer k="notificationPosition">
							<MkRadios v-model="notificationPosition">
								<template #label><SearchLabel>{{ i18n.ts.position }}</SearchLabel></template>
								<option value="leftTop"><i class="ti ti-align-box-left-top"></i> {{ i18n.ts.leftTop }}</option>
								<option value="rightTop"><i class="ti ti-align-box-right-top"></i> {{ i18n.ts.rightTop }}</option>
								<option value="leftBottom"><i class="ti ti-align-box-left-bottom"></i> {{ i18n.ts.leftBottom }}</option>
								<option value="rightBottom"><i class="ti ti-align-box-right-bottom"></i> {{ i18n.ts.rightBottom }}</option>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['stack', 'axis', 'direction']">
						<MkPreferenceContainer k="notificationStackAxis">
							<MkRadios v-model="notificationStackAxis">
								<template #label><SearchLabel>{{ i18n.ts.stackAxis }}</SearchLabel></template>
								<option value="vertical"><i class="ti ti-carousel-vertical"></i> {{ i18n.ts.vertical }}</option>
								<option value="horizontal"><i class="ti ti-carousel-horizontal"></i> {{ i18n.ts.horizontal }}</option>
							</MkRadios>
						</MkPreferenceContainer>
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
import { prefer } from '@/preferences.js';
import { reloadAsk } from '@/utility/reload-ask.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/utility/page-metadata.js';
import { miLocalStorage } from '@/local-storage.js';
import FormLink from '@/components/form/link.vue';
import { globalEvents } from '@/events.js';
import { claimAchievement } from '@/utility/achievements.js';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import { instance } from '@/instance.js';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';

const fontSize = ref(miLocalStorage.getItem('fontSize'));
const useSystemFont = ref(miLocalStorage.getItem('useSystemFont') != null);

const showAvatarDecorations = prefer.model('showAvatarDecorations');
const emojiStyle = prefer.model('emojiStyle');
const menuStyle = prefer.model('menuStyle');
const useBlurEffectForModal = prefer.model('useBlurEffectForModal');
const useBlurEffect = prefer.model('useBlurEffect');
const highlightSensitiveMedia = prefer.model('highlightSensitiveMedia');
const squareAvatars = prefer.model('squareAvatars');
const enableSeasonalScreenEffect = prefer.model('enableSeasonalScreenEffect');
const showGapBetweenNotesInTimeline = prefer.model('showGapBetweenNotesInTimeline');
const mediaListWithOneImageAppearance = prefer.model('mediaListWithOneImageAppearance');
const reactionsDisplaySize = prefer.model('reactionsDisplaySize');
const limitWidthOfReaction = prefer.model('limitWidthOfReaction');
const notificationPosition = prefer.model('notificationPosition');
const notificationStackAxis = prefer.model('notificationStackAxis');
const nsfw = prefer.model('nsfw');
const instanceTicker = prefer.model('instanceTicker');

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
