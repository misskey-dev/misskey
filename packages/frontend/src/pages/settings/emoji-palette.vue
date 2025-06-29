<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/emoji-palette" :label="i18n.ts.emojiPalette" :keywords="['emoji', 'palette']" icon="ti ti-mood-happy">
	<div class="_gaps_m">
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
						<MkSelect v-model="emojiPaletteForMain">
							<template #label><SearchLabel>{{ i18n.ts._emojiPalette.paletteForMain }}</SearchLabel></template>
							<option key="-" :value="null">({{ i18n.ts.auto }})</option>
							<option v-for="palette in prefer.r.emojiPalettes.value" :key="palette.id" :value="palette.id">{{ palette.name === '' ? '(' + i18n.ts.noName + ')' : palette.name }}</option>
						</MkSelect>
					</MkPreferenceContainer>
				</SearchMarker>

				<SearchMarker :keywords="['reaction', 'palette']">
					<MkPreferenceContainer k="emojiPaletteForReaction">
						<MkSelect v-model="emojiPaletteForReaction">
							<template #label><SearchLabel>{{ i18n.ts._emojiPalette.paletteForReaction }}</SearchLabel></template>
							<option key="-" :value="null">({{ i18n.ts.auto }})</option>
							<option v-for="palette in prefer.r.emojiPalettes.value" :key="palette.id" :value="palette.id">{{ palette.name === '' ? '(' + i18n.ts.noName + ')' : palette.name }}</option>
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
							<MkRadios v-model="emojiPickerScale">
								<template #label><SearchLabel>{{ i18n.ts.size }}</SearchLabel></template>
								<option :value="1">{{ i18n.ts.small }}</option>
								<option :value="2">{{ i18n.ts.medium }}</option>
								<option :value="3">{{ i18n.ts.large }}</option>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['emoji', 'picker', 'width', 'column', 'size']">
						<MkPreferenceContainer k="emojiPickerWidth">
							<MkRadios v-model="emojiPickerWidth">
								<template #label><SearchLabel>{{ i18n.ts.numberOfColumn }}</SearchLabel></template>
								<option :value="1">5</option>
								<option :value="2">6</option>
								<option :value="3">7</option>
								<option :value="4">8</option>
								<option :value="5">9</option>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['emoji', 'picker', 'height', 'size']">
						<MkPreferenceContainer k="emojiPickerHeight">
							<MkRadios v-model="emojiPickerHeight">
								<template #label><SearchLabel>{{ i18n.ts.height }}</SearchLabel></template>
								<option :value="1">{{ i18n.ts.small }}</option>
								<option :value="2">{{ i18n.ts.medium }}</option>
								<option :value="3">{{ i18n.ts.large }}</option>
								<option :value="4">{{ i18n.ts.large }}+</option>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['emoji', 'picker', 'style']">
						<MkPreferenceContainer k="emojiPickerStyle">
							<MkSelect v-model="emojiPickerStyle">
								<template #label><SearchLabel>{{ i18n.ts.style }}</SearchLabel></template>
								<template #caption>{{ i18n.ts.needReloadToApply }}</template>
								<option value="auto">{{ i18n.ts.auto }}</option>
								<option value="popup">{{ i18n.ts.popup }}</option>
								<option value="drawer">{{ i18n.ts.drawer }}</option>
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
import { genId } from '@/utility/id.js';
import XPalette from './emoji-palette.palette.vue';
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
const emojiPaletteForMain = prefer.model('emojiPaletteForMain');
const emojiPickerScale = prefer.model('emojiPickerScale');
const emojiPickerWidth = prefer.model('emojiPickerWidth');
const emojiPickerHeight = prefer.model('emojiPickerHeight');
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

function getHTMLElement(ev: MouseEvent): HTMLElement {
	const target = ev.currentTarget ?? ev.target;
	return target as HTMLElement;
}

function previewPicker(ev: MouseEvent) {
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
