<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/sounds" :label="i18n.ts.sounds" :keywords="['sounds']" icon="ti ti-music">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/speaker_high_volume_3d.png" color="#ff006f">
			<SearchText>{{ i18n.ts._settings.soundsBanner }}</SearchText>
		</MkFeatureBanner>

		<SearchMarker :keywords="['mute']">
			<MkPreferenceContainer k="sound.notUseSound">
				<MkSwitch v-model="notUseSound">
					<template #label><SearchLabel>{{ i18n.ts.notUseSound }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['active', 'mute']">
			<MkPreferenceContainer k="sound.useSoundOnlyWhenActive">
				<MkSwitch v-model="useSoundOnlyWhenActive">
					<template #label><SearchLabel>{{ i18n.ts.useSoundOnlyWhenActive }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['volume', 'master']">
			<MkPreferenceContainer k="sound.masterVolume">
				<MkRange v-model="masterVolume" :min="0" :max="1" :step="0.05" :textConverter="(v) => `${Math.floor(v * 100)}%`">
					<template #label><SearchLabel>{{ i18n.ts.masterVolume }}</SearchLabel></template>
				</MkRange>
			</MkPreferenceContainer>
		</SearchMarker>

		<FormSection>
			<template #label>{{ i18n.ts.sounds }}</template>
			<div class="_gaps_s">
				<MkFolder v-for="type in operationTypes" :key="type">
					<template #label>{{ i18n.ts._sfx[type] }}</template>
					<template #suffix>{{ getSoundTypeName(sounds[type].type) }}</template>
					<Suspense>
						<template #default>
							<XSound :def="sounds[type]" @update="(res) => updated(type, res)"/>
						</template>
						<template #fallback>
							<MkLoading/>
						</template>
					</Suspense>
				</MkFolder>
			</div>
		</FormSection>

		<MkButton danger @click="reset()"><i class="ti ti-reload"></i> {{ i18n.ts.default }}</MkButton>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import XSound from './sounds.sound.vue';
import type { Ref } from 'vue';
import type { SoundType, OperationType } from '@/utility/sound.js';
import type { SoundStore } from '@/preferences/def.js';
import { prefer } from '@/preferences.js';
import MkRange from '@/components/MkRange.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { operationTypes } from '@/utility/sound.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import { PREF_DEF } from '@/preferences/def.js';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import { getInitialPrefValue } from '@/preferences/manager.js';

const notUseSound = prefer.model('sound.notUseSound');
const useSoundOnlyWhenActive = prefer.model('sound.useSoundOnlyWhenActive');
const masterVolume = prefer.model('sound.masterVolume');

const sounds = ref<Record<OperationType, Ref<SoundStore>>>({
	note: prefer.r['sound.on.note'],
	noteMy: prefer.r['sound.on.noteMy'],
	notification: prefer.r['sound.on.notification'],
	reaction: prefer.r['sound.on.reaction'],
	chatMessage: prefer.r['sound.on.chatMessage'],
});

function getSoundTypeName(f: SoundType): string {
	switch (f) {
		case null:
			return i18n.ts.none;
		case '_driveFile_':
			return i18n.ts._soundSettings.driveFile;
		default:
			return f;
	}
}

async function updated(type: keyof typeof sounds.value, sound: { type: SoundType; fileId?: string; fileUrl?: string; volume: number; }) {
	const v: SoundStore = sound.type === '_driveFile_' ? {
		type: sound.type,
		fileId: sound.fileId!,
		fileUrl: sound.fileUrl!,
		volume: sound.volume,
	} : {
		type: sound.type,
		volume: sound.volume,
	};

	prefer.commit(`sound.on.${type}`, v);
	sounds.value[type] = v;
}

function reset() {
	for (const sound of Object.keys(sounds.value) as Array<keyof typeof sounds.value>) {
		const v = getInitialPrefValue(`sound.on.${sound}`);
		prefer.commit(`sound.on.${sound}`, v);
		sounds.value[sound] = v;
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.sounds,
	icon: 'ti ti-music',
}));
</script>
