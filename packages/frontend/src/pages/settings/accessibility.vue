<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/accessibility" :label="i18n.ts.accessibility" :keywords="['accessibility']" icon="ti ti-accessible">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/mens_room_3d.png" color="#0011ff">
			<SearchKeyword>{{ i18n.ts._settings.accessibilityBanner }}</SearchKeyword>
		</MkFeatureBanner>

		<div class="_gaps_s">
			<SearchMarker :keywords="['animation', 'motion', 'reduce']">
				<MkPreferenceContainer k="animation">
					<MkSwitch v-model="reduceAnimation">
						<template #label><SearchLabel>{{ i18n.ts.reduceUiAnimation }}</SearchLabel></template>
					</MkSwitch>
				</MkPreferenceContainer>
			</SearchMarker>

			<SearchMarker :keywords="['disable', 'animation', 'image', 'photo', 'picture', 'media', 'thumbnail', 'gif']">
				<MkPreferenceContainer k="disableShowingAnimatedImages">
					<MkSwitch v-model="disableShowingAnimatedImages">
						<template #label><SearchLabel>{{ i18n.ts.disableShowingAnimatedImages }}</SearchLabel></template>
					</MkSwitch>
				</MkPreferenceContainer>
			</SearchMarker>

			<SearchMarker :keywords="['mfm', 'enable', 'show', 'animated']">
				<MkPreferenceContainer k="animatedMfm">
					<MkSwitch v-model="animatedMfm">
						<template #label><SearchLabel>{{ i18n.ts.enableAnimatedMfm }}</SearchLabel></template>
					</MkSwitch>
				</MkPreferenceContainer>
			</SearchMarker>

			<SearchMarker :keywords="['swipe', 'horizontal', 'tab']">
				<MkPreferenceContainer k="enableHorizontalSwipe">
					<MkSwitch v-model="enableHorizontalSwipe">
						<template #label><SearchLabel>{{ i18n.ts.enableHorizontalSwipe }}</SearchLabel></template>
					</MkSwitch>
				</MkPreferenceContainer>
			</SearchMarker>

			<SearchMarker :keywords="['keep', 'screen', 'display', 'on']">
				<MkPreferenceContainer k="keepScreenOn">
					<MkSwitch v-model="keepScreenOn">
						<template #label><SearchLabel>{{ i18n.ts.keepScreenOn }}</SearchLabel></template>
					</MkSwitch>
				</MkPreferenceContainer>
			</SearchMarker>

			<SearchMarker :keywords="['native', 'system', 'video', 'audio', 'player', 'media']">
				<MkPreferenceContainer k="useNativeUiForVideoAudioPlayer">
					<MkSwitch v-model="useNativeUiForVideoAudioPlayer">
						<template #label><SearchLabel>{{ i18n.ts.useNativeUIForVideoAudioPlayer }}</SearchLabel></template>
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

		<SearchMarker :keywords="['contextmenu', 'system', 'native']">
			<MkPreferenceContainer k="contextMenu">
				<MkSelect v-model="contextMenu">
					<template #label><SearchLabel>{{ i18n.ts._contextMenu.title }}</SearchLabel></template>
					<option value="app">{{ i18n.ts._contextMenu.app }}</option>
					<option value="appWithShift">{{ i18n.ts._contextMenu.appWithShift }}</option>
					<option value="native">{{ i18n.ts._contextMenu.native }}</option>
				</MkSelect>
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
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import { prefer } from '@/preferences.js';
import { reloadAsk } from '@/utility/reload-ask.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import { miLocalStorage } from '@/local-storage.js';
import MkRadios from '@/components/MkRadios.vue';

const reduceAnimation = prefer.model('animation', v => !v, v => !v);
const animatedMfm = prefer.model('animatedMfm');
const disableShowingAnimatedImages = prefer.model('disableShowingAnimatedImages');
const keepScreenOn = prefer.model('keepScreenOn');
const enableHorizontalSwipe = prefer.model('enableHorizontalSwipe');
const useNativeUiForVideoAudioPlayer = prefer.model('useNativeUiForVideoAudioPlayer');
const contextMenu = prefer.model('contextMenu');
const menuStyle = prefer.model('menuStyle');

const fontSize = ref(miLocalStorage.getItem('fontSize'));
const useSystemFont = ref(miLocalStorage.getItem('useSystemFont') != null);

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
	keepScreenOn,
	contextMenu,
	fontSize,
	useSystemFont,
], async () => {
	await reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.accessibility,
	icon: 'ti ti-accessible',
}));
</script>
