<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/preferences" :label="i18n.ts.preferences" :keywords="['general', 'preferences']" icon="ti ti-adjustments">
	<div class="_gaps_m">
		<SearchMarker :keywords="['language']">
			<MkSelect v-model="lang">
				<template #label><SearchLabel>{{ i18n.ts.uiLanguage }}</SearchLabel></template>
				<option v-for="x in langs" :key="x[0]" :value="x[0]">{{ x[1] }}</option>
				<template #caption>
					<I18n :src="i18n.ts.i18nInfo" tag="span">
						<template #link>
							<MkLink url="https://crowdin.com/project/misskey">Crowdin</MkLink>
						</template>
					</I18n>
				</template>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['device', 'type', 'kind', 'smartphone', 'tablet', 'desktop']">
			<MkRadios v-model="overridedDeviceKind">
				<template #label><SearchLabel>{{ i18n.ts.overridedDeviceKind }}</SearchLabel></template>
				<option :value="null">{{ i18n.ts.auto }}</option>
				<option value="smartphone"><i class="ti ti-device-mobile"/> {{ i18n.ts.smartphone }}</option>
				<option value="tablet"><i class="ti ti-device-tablet"/> {{ i18n.ts.tablet }}</option>
				<option value="desktop"><i class="ti ti-device-desktop"/> {{ i18n.ts.desktop }}</option>
			</MkRadios>
		</SearchMarker>

		<FormSection>
			<div class="_gaps_s">
				<SearchMarker :keywords="['post', 'form', 'timeline']">
					<MkSwitch v-model="showFixedPostForm">
						<template #label><SearchLabel>{{ i18n.ts.showFixedPostForm }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['post', 'form', 'timeline', 'channel']">
					<MkSwitch v-model="showFixedPostFormInChannel">
						<template #label><SearchLabel>{{ i18n.ts.showFixedPostFormInChannel }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['pinned', 'list']">
					<MkFolder>
						<template #label><SearchLabel>{{ i18n.ts.pinnedList }}</SearchLabel></template>
						<!-- 複数ピン止め管理できるようにしたいけどめんどいので一旦ひとつのみ -->
						<MkButton v-if="defaultStore.reactiveState.pinnedUserLists.value.length === 0" @click="setPinnedList()">{{ i18n.ts.add }}</MkButton>
						<MkButton v-else danger @click="removePinnedList()"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['mfm', 'enable', 'show', 'advanced', 'picker', 'form', 'function', 'fn']">
					<MkSwitch v-model="enableQuickAddMfmFunction">
						<template #label><SearchLabel>{{ i18n.ts.enableQuickAddMfmFunction }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>
			</div>
		</FormSection>

		<SearchMarker :keywords="['note']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.note }}</SearchLabel></template>

				<div class="_gaps_m">
					<div class="_gaps_s">
						<SearchMarker :keywords="['renote']">
							<MkSwitch v-model="collapseRenotes">
								<template #label><SearchLabel>{{ i18n.ts.collapseRenotes }}</SearchLabel></template>
								<template #caption><SearchKeyword>{{ i18n.ts.collapseRenotesDescription }}</SearchKeyword></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['hover', 'show', 'footer', 'action']">
							<MkSwitch v-model="showNoteActionsOnlyHover">
								<template #label><SearchLabel>{{ i18n.ts.showNoteActionsOnlyHover }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['footer', 'action', 'clip', 'show']">
							<MkSwitch v-model="showClipButtonInNoteFooter">
								<template #label><SearchLabel>{{ i18n.ts.showClipButtonInNoteFooter }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['mfm', 'enable', 'show', 'advanced']">
							<MkSwitch v-model="advancedMfm">
								<template #label><SearchLabel>{{ i18n.ts.enableAdvancedMfm }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['reaction', 'count', 'show']">
							<MkSwitch v-model="showReactionsCount">
								<template #label><SearchLabel>{{ i18n.ts.showReactionsCount }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['image', 'photo', 'picture', 'media', 'thumbnail', 'quality', 'raw', 'attachment']">
							<MkSwitch v-model="loadRawImages">
								<template #label><SearchLabel>{{ i18n.ts.loadRawImages }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>
					</div>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['notification']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.notifications }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['group']">
						<MkSwitch v-model="useGroupedNotifications">
							<template #label><SearchLabel>{{ i18n.ts.useGroupedNotifications }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['behavior']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.behavior }}</SearchLabel></template>

				<div class="_gaps_m">
					<div class="_gaps_s">
						<SearchMarker :keywords="['image', 'photo', 'picture', 'media', 'thumbnail', 'new', 'tab']">
							<MkSwitch v-model="imageNewTab">
								<template #label><SearchLabel>{{ i18n.ts.openImageInNewTab }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['reaction', 'picker', 'contextmenu', 'open']">
							<MkSwitch v-model="useReactionPickerForContextMenu">
								<template #label><SearchLabel>{{ i18n.ts.useReactionPickerForContextMenu }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['load', 'auto', 'more']">
							<MkSwitch v-model="enableInfiniteScroll">
								<template #label><SearchLabel>{{ i18n.ts.enableInfiniteScroll }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['disable', 'streaming', 'timeline']">
							<MkSwitch v-model="disableStreamingTimeline">
								<template #label><SearchLabel>{{ i18n.ts.disableStreamingTimeline }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['follow', 'confirm', 'always']">
							<MkSwitch v-model="alwaysConfirmFollow">
								<template #label><SearchLabel>{{ i18n.ts.alwaysConfirmFollow }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['sensitive', 'nsfw', 'media', 'image', 'photo', 'picture', 'attachment', 'confirm']">
							<MkSwitch v-model="confirmWhenRevealingSensitiveMedia">
								<template #label><SearchLabel>{{ i18n.ts.confirmWhenRevealingSensitiveMedia }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['reaction', 'confirm']">
							<MkSwitch v-model="confirmOnReact">
								<template #label><SearchLabel>{{ i18n.ts.confirmOnReact }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>
					</div>

					<SearchMarker :keywords="['server', 'disconnect', 'reconnect', 'reload', 'streaming']">
						<MkSelect v-model="serverDisconnectedBehavior">
							<template #label><SearchLabel>{{ i18n.ts.whenServerDisconnected }}</SearchLabel></template>
							<option value="reload">{{ i18n.ts._serverDisconnectedBehavior.reload }}</option>
							<option value="dialog">{{ i18n.ts._serverDisconnectedBehavior.dialog }}</option>
							<option value="quiet">{{ i18n.ts._serverDisconnectedBehavior.quiet }}</option>
						</MkSelect>
					</SearchMarker>

					<SearchMarker :keywords="['cache', 'page']">
						<MkRange v-model="numberOfPageCache" :min="1" :max="10" :step="1" easing>
							<template #label><SearchLabel>{{ i18n.ts.numberOfPageCache }}</SearchLabel></template>
							<template #caption>{{ i18n.ts.numberOfPageCacheDescription }}</template>
						</MkRange>
					</SearchMarker>

					<SearchMarker :label="i18n.ts.dataSaver" :keywords="['datasaver']">
						<MkFolder>
							<template #label><SearchLabel>{{ i18n.ts.dataSaver }}</SearchLabel></template>

							<div class="_gaps_m">
								<MkInfo>{{ i18n.ts.reloadRequiredToApplySettings }}</MkInfo>

								<div class="_buttons">
									<MkButton inline @click="enableAllDataSaver">{{ i18n.ts.enableAll }}</MkButton>
									<MkButton inline @click="disableAllDataSaver">{{ i18n.ts.disableAll }}</MkButton>
								</div>
								<div class="_gaps_m">
									<MkSwitch v-model="dataSaver.media">
										{{ i18n.ts._dataSaver._media.title }}
										<template #caption>{{ i18n.ts._dataSaver._media.description }}</template>
									</MkSwitch>
									<MkSwitch v-model="dataSaver.avatar">
										{{ i18n.ts._dataSaver._avatar.title }}
										<template #caption>{{ i18n.ts._dataSaver._avatar.description }}</template>
									</MkSwitch>
									<MkSwitch v-model="dataSaver.urlPreview">
										{{ i18n.ts._dataSaver._urlPreview.title }}
										<template #caption>{{ i18n.ts._dataSaver._urlPreview.description }}</template>
									</MkSwitch>
									<MkSwitch v-model="dataSaver.code">
										{{ i18n.ts._dataSaver._code.title }}
										<template #caption>{{ i18n.ts._dataSaver._code.description }}</template>
									</MkSwitch>
								</div>
							</div>
						</MkFolder>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker>
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.other }}</SearchLabel></template>

				<div class="_gaps">
					<SearchMarker :keywords="['ad', 'show']">
						<MkSwitch v-model="forceShowAds">
							<template #label><SearchLabel>{{ i18n.ts.forceShowAds }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker>
						<MkRadios v-model="hemisphere">
							<template #label><SearchLabel>{{ i18n.ts.hemisphere }}</SearchLabel></template>
							<option value="N">{{ i18n.ts._hemisphere.N }}</option>
							<option value="S">{{ i18n.ts._hemisphere.S }}</option>
							<template #caption>{{ i18n.ts._hemisphere.caption }}</template>
						</MkRadios>
					</SearchMarker>

					<SearchMarker :keywords="['emoji', 'dictionary', 'additional', 'extra']">
						<MkFolder>
							<template #label><SearchLabel>{{ i18n.ts.additionalEmojiDictionary }}</SearchLabel></template>
							<div class="_buttons">
								<template v-for="lang in emojiIndexLangs" :key="lang">
									<MkButton v-if="defaultStore.reactiveState.additionalUnicodeEmojiIndexes.value[lang]" danger @click="removeEmojiIndex(lang)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }} ({{ getEmojiIndexLangName(lang) }})</MkButton>
									<MkButton v-else @click="downloadEmojiIndex(lang)"><i class="ti ti-download"></i> {{ getEmojiIndexLangName(lang) }}{{ defaultStore.reactiveState.additionalUnicodeEmojiIndexes.value[lang] ? ` (${ i18n.ts.installed })` : '' }}</MkButton>
								</template>
							</div>
						</MkFolder>
					</SearchMarker>

					<FormLink to="/settings/navbar">{{ i18n.ts.navbar }}</FormLink>
					<FormLink to="/settings/statusbar">{{ i18n.ts.statusbar }}</FormLink>
				</div>
			</FormSection>
		</SearchMarker>

		<FormSection>
			<div class="_gaps">
				<FormLink to="/settings/deck">{{ i18n.ts.deck }}</FormLink>
			</div>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { langs } from '@@/js/config.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkRange from '@/components/MkRange.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/form/link.vue';
import MkLink from '@/components/MkLink.vue';
import MkInfo from '@/components/MkInfo.vue';
import { defaultStore } from '@/store.js';
import * as os from '@/os.js';
import { instance } from '@/instance.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { reloadAsk } from '@/scripts/reload-ask.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { miLocalStorage } from '@/local-storage.js';

const lang = ref(miLocalStorage.getItem('lang'));
const dataSaver = ref(defaultStore.state.dataSaver);

const hemisphere = computed(defaultStore.makeGetterSetter('hemisphere'));
const overridedDeviceKind = computed(defaultStore.makeGetterSetter('overridedDeviceKind'));
const serverDisconnectedBehavior = computed(defaultStore.makeGetterSetter('serverDisconnectedBehavior'));
const showNoteActionsOnlyHover = computed(defaultStore.makeGetterSetter('showNoteActionsOnlyHover'));
const showClipButtonInNoteFooter = computed(defaultStore.makeGetterSetter('showClipButtonInNoteFooter'));
const collapseRenotes = computed(defaultStore.makeGetterSetter('collapseRenotes'));
const advancedMfm = computed(defaultStore.makeGetterSetter('advancedMfm'));
const showReactionsCount = computed(defaultStore.makeGetterSetter('showReactionsCount'));
const enableQuickAddMfmFunction = computed(defaultStore.makeGetterSetter('enableQuickAddMfmFunction'));
const forceShowAds = computed(defaultStore.makeGetterSetter('forceShowAds'));
const loadRawImages = computed(defaultStore.makeGetterSetter('loadRawImages'));
const imageNewTab = computed(defaultStore.makeGetterSetter('imageNewTab'));
const showFixedPostForm = computed(defaultStore.makeGetterSetter('showFixedPostForm'));
const showFixedPostFormInChannel = computed(defaultStore.makeGetterSetter('showFixedPostFormInChannel'));
const numberOfPageCache = computed(defaultStore.makeGetterSetter('numberOfPageCache'));
const enableInfiniteScroll = computed(defaultStore.makeGetterSetter('enableInfiniteScroll'));
const useReactionPickerForContextMenu = computed(defaultStore.makeGetterSetter('useReactionPickerForContextMenu'));
const disableStreamingTimeline = computed(defaultStore.makeGetterSetter('disableStreamingTimeline'));
const useGroupedNotifications = computed(defaultStore.makeGetterSetter('useGroupedNotifications'));
const alwaysConfirmFollow = computed(defaultStore.makeGetterSetter('alwaysConfirmFollow'));
const confirmWhenRevealingSensitiveMedia = computed(defaultStore.makeGetterSetter('confirmWhenRevealingSensitiveMedia'));
const confirmOnReact = computed(defaultStore.makeGetterSetter('confirmOnReact'));
const contextMenu = computed(defaultStore.makeGetterSetter('contextMenu'));

watch(lang, () => {
	miLocalStorage.setItem('lang', lang.value as string);
	miLocalStorage.removeItem('locale');
	miLocalStorage.removeItem('localeVersion');
});

watch([
	hemisphere,
	lang,
	enableInfiniteScroll,
	showNoteActionsOnlyHover,
	overridedDeviceKind,
	disableStreamingTimeline,
	alwaysConfirmFollow,
	confirmWhenRevealingSensitiveMedia,
	contextMenu,
], async () => {
	await reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

const emojiIndexLangs = ['en-US', 'ja-JP', 'ja-JP_hira'] as const;

function getEmojiIndexLangName(targetLang: typeof emojiIndexLangs[number]) {
	if (langs.find(x => x[0] === targetLang)) {
		return langs.find(x => x[0] === targetLang)![1];
	} else {
		// 絵文字辞書限定の言語定義
		switch (targetLang) {
			case 'ja-JP_hira': return 'ひらがな';
			default: return targetLang;
		}
	}
}

function downloadEmojiIndex(lang: typeof emojiIndexLangs[number]) {
	async function main() {
		const currentIndexes = defaultStore.state.additionalUnicodeEmojiIndexes;

		function download() {
			switch (lang) {
				case 'en-US': return import('../../unicode-emoji-indexes/en-US.json').then(x => x.default);
				case 'ja-JP': return import('../../unicode-emoji-indexes/ja-JP.json').then(x => x.default);
				case 'ja-JP_hira': return import('../../unicode-emoji-indexes/ja-JP_hira.json').then(x => x.default);
				default: throw new Error('unrecognized lang: ' + lang);
			}
		}

		currentIndexes[lang] = await download();
		await defaultStore.set('additionalUnicodeEmojiIndexes', currentIndexes);
	}

	os.promiseDialog(main());
}

function removeEmojiIndex(lang: string) {
	async function main() {
		const currentIndexes = defaultStore.state.additionalUnicodeEmojiIndexes;
		delete currentIndexes[lang];
		await defaultStore.set('additionalUnicodeEmojiIndexes', currentIndexes);
	}

	os.promiseDialog(main());
}

async function setPinnedList() {
	const lists = await misskeyApi('users/lists/list');
	const { canceled, result: list } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map(x => ({
			value: x, text: x.name,
		})),
	});
	if (canceled) return;

	defaultStore.set('pinnedUserLists', [list]);
}

function removePinnedList() {
	defaultStore.set('pinnedUserLists', []);
}

function enableAllDataSaver() {
	const g = { ...defaultStore.state.dataSaver };

	Object.keys(g).forEach((key) => { g[key] = true; });

	dataSaver.value = g;
}

function disableAllDataSaver() {
	const g = { ...defaultStore.state.dataSaver };

	Object.keys(g).forEach((key) => { g[key] = false; });

	dataSaver.value = g;
}

watch(dataSaver, (to) => {
	defaultStore.set('dataSaver', to);
}, {
	deep: true,
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.general,
	icon: 'ti ti-adjustments',
}));
</script>
