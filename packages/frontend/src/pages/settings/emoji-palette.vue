<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/emoji-palette" :label="i18n.ts.emojiPalette" :keywords="['emoji', 'palette']" icon="ti ti-mood-happy">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/artist_palette_3d.png" color="#ff9100">
			<SearchText>{{ i18n.ts._settings.emojiPaletteBanner }}</SearchText>
		</MkFeatureBanner>

		<FormSection first>
			<template #label>{{ i18n.ts._emojiPalette.palettes }}</template>

			<div class="_gaps_s">
				<XPalette
					v-for="palette in prefer.r.emojiPalettes.value"
					:key="palette.id"
					:palette="palette"
					@updateEmojis="emojis => updatePaletteEmojis(palette.id, emojis)"
					@updateName="name => updatePaletteName(palette.id, name)"
					@del="delPalette(palette.id)"
				/>
				<MkButton primary rounded style="margin: auto;" @click="addPalette"><i class="ti ti-plus"></i></MkButton>
			</div>
		</FormSection>

		<FormSection>
			<div class="_gaps_m">
				<SearchMarker :keywords="['sync', 'palettes', 'devices']">
					<MkSwitch :modelValue="palettesSyncEnabled" @update:modelValue="changePalettesSyncEnabled">
						<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ i18n.ts._emojiPalette.enableSyncBetweenDevicesForPalettes }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>
			</div>
		</FormSection>

		<FormSection>
			<div class="_gaps_m">
				<SearchMarker :keywords="['main', 'palette']">
					<MkPreferenceContainer k="emojiPaletteForMain">
						<MkSelect v-model="emojiPaletteForMain" :items="emojiPaletteForMainDef">
							<template #label><SearchLabel>{{ i18n.ts._emojiPalette.paletteForMain }}</SearchLabel></template>
						</MkSelect>
					</MkPreferenceContainer>
				</SearchMarker>

				<SearchMarker :keywords="['reaction', 'palette']">
					<MkPreferenceContainer k="emojiPaletteForReaction">
						<MkSelect v-model="emojiPaletteForReaction" :items="emojiPaletteForReactionDef">
							<template #label><SearchLabel>{{ i18n.ts._emojiPalette.paletteForReaction }}</SearchLabel></template>
						</MkSelect>
					</MkPreferenceContainer>
				</SearchMarker>
			</div>
		</FormSection>

		<SearchMarker :keywords="['emoji', 'picker', 'display']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.emojiPickerDisplay }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['emoji', 'picker', 'scale', 'size']">
						<MkPreferenceContainer k="emojiPickerScale">
							<MkRadios
								v-model="emojiPickerScale"
								:options="emojiPickerScaleDef"
							>
								<template #label><SearchLabel>{{ i18n.ts.size }}</SearchLabel></template>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['emoji', 'picker', 'width', 'column', 'size']">
						<MkPreferenceContainer k="emojiPickerWidth">
							<MkRadios
								v-model="emojiPickerWidth"
								:options="emojiPickerWidthDef"
							>
								<template #label><SearchLabel>{{ i18n.ts.numberOfColumn }}</SearchLabel></template>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['emoji', 'picker', 'height', 'size']">
						<MkPreferenceContainer k="emojiPickerHeight">
							<MkRadios
								v-model="emojiPickerHeight"
								:options="emojiPickerHeightDef"
							>
								<template #label><SearchLabel>{{ i18n.ts.height }}</SearchLabel></template>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['emoji', 'picker', 'style']">
						<MkPreferenceContainer k="emojiPickerStyle">
							<MkSelect
								v-model="emojiPickerStyle" :items="[
									{ label: i18n.ts.auto, value: 'auto' },
									{ label: i18n.ts.popup, value: 'popup' },
									{ label: i18n.ts.drawer, value: 'drawer' },
								]"
							>
								<template #label><SearchLabel>{{ i18n.ts.style }}</SearchLabel></template>
								<template #caption>{{ i18n.ts.needReloadToApply }}</template>
							</MkSelect>
						</MkPreferenceContainer>
					</SearchMarker>

					<MkButton @click="previewPicker"><i class="ti ti-eye"></i> {{ i18n.ts.preview }}</MkButton>
				</div>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import XPalette from './emoji-palette.palette.vue';
import type { MkSelectItem } from '@/components/MkSelect.vue';
import type { MkRadiosOption } from '@/components/MkRadios.vue';
import { genId } from '@/utility/id.js';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkFolder from '@/components/MkFolder.vue';
import { prefer } from '@/preferences.js';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { emojiPicker } from '@/utility/emoji-picker.js';

const emojiPaletteForReaction = prefer.model('emojiPaletteForReaction');
const emojiPaletteForReactionDef = computed<MkSelectItem[]>(() => [
	{ label: `(${i18n.ts.auto})`, value: null },
	...prefer.s.emojiPalettes.map(palette => ({
		label: palette.name === '' ? `(${i18n.ts.noName})` : palette.name,
		value: palette.id,
	})),
]);
const emojiPaletteForMain = prefer.model('emojiPaletteForMain');
const emojiPaletteForMainDef = computed<MkSelectItem[]>(() => [
	{ label: `(${i18n.ts.auto})`, value: null },
	...prefer.s.emojiPalettes.map(palette => ({
		label: palette.name === '' ? `(${i18n.ts.noName})` : palette.name,
		value: palette.id,
	})),
]);
const emojiPickerScale = prefer.model('emojiPickerScale');
const emojiPickerScaleDef = [
	{ label: i18n.ts.small, value: 1 },
	{ label: i18n.ts.medium, value: 2 },
	{ label: i18n.ts.large, value: 3 },
	{ label: i18n.ts.large + '+', value: 4 },
	{ label: i18n.ts.large + '++', value: 5 },
] as MkRadiosOption<number>[];

const emojiPickerWidth = prefer.model('emojiPickerWidth');
const emojiPickerWidthDef = [
	{ label: '5', value: 1 },
	{ label: '6', value: 2 },
	{ label: '7', value: 3 },
	{ label: '8', value: 4 },
	{ label: '9', value: 5 },
] as MkRadiosOption<number>[];

const emojiPickerHeight = prefer.model('emojiPickerHeight');
const emojiPickerHeightDef = [
	{ label: i18n.ts.small, value: 1 },
	{ label: i18n.ts.medium, value: 2 },
	{ label: i18n.ts.large, value: 3 },
	{ label: i18n.ts.large + '+', value: 4 },
] as MkRadiosOption<number>[];

const emojiPickerStyle = prefer.model('emojiPickerStyle');

const palettesSyncEnabled = ref(prefer.isSyncEnabled('emojiPalettes'));

function changePalettesSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('emojiPalettes').then((res) => {
			if (res == null) return;
			if (res.enabled) palettesSyncEnabled.value = true;
		});
	} else {
		prefer.disableSync('emojiPalettes');
		palettesSyncEnabled.value = false;
	}
}

function addPalette() {
	prefer.commit('emojiPalettes', [
		...prefer.s.emojiPalettes,
		{
			id: genId(),
			name: '',
			emojis: [],
		},
	]);
}

function updatePaletteEmojis(id: string, emojis: string[]) {
	prefer.commit('emojiPalettes', prefer.s.emojiPalettes.map(palette => {
		if (palette.id === id) {
			return {
				...palette,
				emojis,
			};
		} else {
			return palette;
		}
	}));
}

function updatePaletteName(id: string, name: string) {
	prefer.commit('emojiPalettes', prefer.s.emojiPalettes.map(palette => {
		if (palette.id === id) {
			return {
				...palette,
				name,
			};
		} else {
			return palette;
		}
	}));
}

function delPalette(id: string) {
	if (prefer.s.emojiPalettes.length === 1) {
		addPalette();
	}
	prefer.commit('emojiPalettes', prefer.s.emojiPalettes.filter(palette => palette.id !== id));
	if (prefer.s.emojiPaletteForMain === id) {
		prefer.commit('emojiPaletteForMain', null);
	}
	if (prefer.s.emojiPaletteForReaction === id) {
		prefer.commit('emojiPaletteForReaction', null);
	}
}

function getHTMLElement(ev: PointerEvent): HTMLElement {
	const target = ev.currentTarget ?? ev.target;
	return target as HTMLElement;
}

function previewPicker(ev: PointerEvent) {
	emojiPicker.show(getHTMLElement(ev));
}

definePage(() => ({
	title: i18n.ts.emojiPalette,
	icon: 'ti ti-mood-happy',
}));
</script>

<style lang="scss" module>
.emojis {
  padding: 12px;
  font-size: 1.1em;
}

.emojisItem {
  display: inline-block;
  padding: 8px;
  cursor: move;
}

.emojisAdd {
  display: inline-block;
  padding: 8px;
}

.editorCaption {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}
</style>
