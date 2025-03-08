<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/accessibility" :label="i18n.ts.accessibility" :keywords="['accessibility']" icon="ti ti-accessible">
	<div class="_gaps_m">
		<div class="_gaps_s">
			<SearchMarker :keywords="['animation', 'motion', 'reduce']">
				<MkSwitch v-model="reduceAnimation">
					<template #label><SearchLabel>{{ i18n.ts.reduceUiAnimation }}</SearchLabel></template>
				</MkSwitch>
			</SearchMarker>

			<SearchMarker :keywords="['disable', 'animation', 'image', 'photo', 'picture', 'media', 'thumbnail', 'gif']">
				<MkSwitch v-model="disableShowingAnimatedImages">
					<template #label><SearchLabel>{{ i18n.ts.disableShowingAnimatedImages }}</SearchLabel></template>
				</MkSwitch>
			</SearchMarker>

			<SearchMarker :keywords="['mfm', 'enable', 'show', 'animated']">
				<MkSwitch v-model="animatedMfm">
					<template #label><SearchLabel>{{ i18n.ts.enableAnimatedMfm }}</SearchLabel></template>
				</MkSwitch>
			</SearchMarker>

			<SearchMarker :keywords="['swipe', 'horizontal', 'tab']">
				<MkSwitch v-model="enableHorizontalSwipe">
					<template #label><SearchLabel>{{ i18n.ts.enableHorizontalSwipe }}</SearchLabel></template>
				</MkSwitch>
			</SearchMarker>

			<SearchMarker :keywords="['keep', 'screen', 'display', 'on']">
				<MkSwitch v-model="keepScreenOn">
					<template #label><SearchLabel>{{ i18n.ts.keepScreenOn }}</SearchLabel></template>
				</MkSwitch>
			</SearchMarker>

			<SearchMarker :keywords="['native', 'system', 'video', 'audio', 'player', 'media']">
				<MkSwitch v-model="useNativeUIForVideoAudioPlayer">
					<template #label><SearchLabel>{{ i18n.ts.useNativeUIForVideoAudioPlayer }}</SearchLabel></template>
				</MkSwitch>
			</SearchMarker>
		</div>

		<SearchMarker :keywords="['contextmenu', 'system', 'native']">
			<MkSelect v-model="contextMenu">
				<template #label><SearchLabel>{{ i18n.ts._contextMenu.title }}</SearchLabel></template>
				<option value="app">{{ i18n.ts._contextMenu.app }}</option>
				<option value="appWithShift">{{ i18n.ts._contextMenu.appWithShift }}</option>
				<option value="native">{{ i18n.ts._contextMenu.native }}</option>
			</MkSelect>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import { defaultStore } from '@/store.js';
import { reloadAsk } from '@/scripts/reload-ask.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const reduceAnimation = computed(defaultStore.makeGetterSetter('animation', v => !v, v => !v));
const animatedMfm = computed(defaultStore.makeGetterSetter('animatedMfm'));
const disableShowingAnimatedImages = computed(defaultStore.makeGetterSetter('disableShowingAnimatedImages'));
const keepScreenOn = computed(defaultStore.makeGetterSetter('keepScreenOn'));
const enableHorizontalSwipe = computed(defaultStore.makeGetterSetter('enableHorizontalSwipe'));
const useNativeUIForVideoAudioPlayer = computed(defaultStore.makeGetterSetter('useNativeUIForVideoAudioPlayer'));
const contextMenu = computed(defaultStore.makeGetterSetter('contextMenu'));

watch([
	keepScreenOn,
	contextMenu,
], async () => {
	await reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.accessibility,
	icon: 'ti ti-accessible',
}));
</script>
