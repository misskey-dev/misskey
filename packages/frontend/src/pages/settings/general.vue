<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/general" :label="i18n.ts.general" :keywords="['general']" icon="ti ti-adjustments">
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
			</div>
		</FormSection>

		<SearchMarker :keywords="['note', 'display']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.displayOfNote }}</SearchLabel></template>

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

						<SearchMarker :keywords="['mfm', 'enable', 'show', 'animated']">
							<MkSwitch v-if="advancedMfm" v-model="animatedMfm">
								<template #label><SearchLabel>{{ i18n.ts.enableAnimatedMfm }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['mfm', 'enable', 'show', 'advanced', 'picker', 'form', 'function', 'fn']">
							<MkSwitch v-if="advancedMfm" v-model="enableQuickAddMfmFunction">
								<template #label><SearchLabel>{{ i18n.ts.enableQuickAddMfmFunction }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['reaction', 'count', 'show']">
							<MkSwitch v-model="showReactionsCount">
								<template #label><SearchLabel>{{ i18n.ts.showReactionsCount }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['note', 'timeline', 'gap']">
							<MkSwitch v-model="showGapBetweenNotesInTimeline">
								<template #label><SearchLabel>{{ i18n.ts.showGapBetweenNotesInTimeline }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['image', 'photo', 'picture', 'media', 'thumbnail', 'quality', 'raw', 'attachment']">
							<MkSwitch v-model="loadRawImages">
								<template #label><SearchLabel>{{ i18n.ts.loadRawImages }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

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
					</div>

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

					<SearchMarker :keywords="['attachment', 'image', 'photo', 'picture', 'media', 'thumbnail', 'list', 'size', 'height']">
						<MkRadios v-model="mediaListWithOneImageAppearance">
							<template #label><SearchLabel>{{ i18n.ts.mediaListWithOneImageAppearance }}</SearchLabel></template>
							<option value="expand">{{ i18n.ts.default }}</option>
							<option value="16_9">{{ i18n.tsx.limitTo({ x: '16:9' }) }}</option>
							<option value="1_1">{{ i18n.tsx.limitTo({ x: '1:1' }) }}</option>
							<option value="2_3">{{ i18n.tsx.limitTo({ x: '2:3' }) }}</option>
						</MkRadios>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['notification', 'display']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.notificationDisplay }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['group']">
						<MkSwitch v-model="useGroupedNotifications">
							<template #label><SearchLabel>{{ i18n.ts.useGroupedNotifications }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

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

		<SearchMarker :keywords="['appearance']">
			<FormSection>
				<template #label><SearchLabel>{{ i18n.ts.appearance }}</SearchLabel></template>

				<div class="_gaps_m">
					<div class="_gaps_s">
						<SearchMarker :keywords="['animation', 'motion', 'reduce']">
							<MkSwitch v-model="reduceAnimation">
								<template #label><SearchLabel>{{ i18n.ts.reduceUiAnimation }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

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

						<SearchMarker :keywords="['disable', 'animation', 'image', 'photo', 'picture', 'media', 'thumbnail', 'gif']">
							<MkSwitch v-model="disableShowingAnimatedImages">
								<template #label><SearchLabel>{{ i18n.ts.disableShowingAnimatedImages }}</SearchLabel></template>
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

						<SearchMarker :keywords="['font', 'system', 'native']">
							<MkSwitch v-model="useSystemFont">
								<template #label><SearchLabel>{{ i18n.ts.useSystemFont }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['ad', 'show']">
							<MkSwitch v-model="forceShowAds">
								<template #label><SearchLabel>{{ i18n.ts.forceShowAds }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['effect', 'show']">
							<MkSwitch v-model="enableSeasonalScreenEffect">
								<template #label><SearchLabel>{{ i18n.ts.seasonalScreenEffect }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['native', 'system', 'video', 'audio', 'player', 'media']">
							<MkSwitch v-model="useNativeUIForVideoAudioPlayer">
								<template #label><SearchLabel>{{ i18n.ts.useNativeUIForVideoAudioPlayer }}</SearchLabel></template>
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

						<SearchMarker :keywords="['keep', 'screen', 'display', 'on']">
							<MkSwitch v-model="keepScreenOn">
								<template #label><SearchLabel>{{ i18n.ts.keepScreenOn }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['disable', 'streaming', 'timeline']">
							<MkSwitch v-model="disableStreamingTimeline">
								<template #label><SearchLabel>{{ i18n.ts.disableStreamingTimeline }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>

						<SearchMarker :keywords="['swipe', 'horizontal', 'tab']">
							<MkSwitch v-model="enableHorizontalSwipe">
								<template #label><SearchLabel>{{ i18n.ts.enableHorizontalSwipe }}</SearchLabel></template>
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

					<SearchMarker :keywords="['contextmenu', 'system', 'native']">
						<MkSelect v-model="contextMenu">
							<template #label><SearchLabel>{{ i18n.ts._contextMenu.title }}</SearchLabel></template>
							<option value="app">{{ i18n.ts._contextMenu.app }}</option>
							<option value="appWithShift">{{ i18n.ts._contextMenu.appWithShift }}</option>
							<option value="native">{{ i18n.ts._contextMenu.native }}</option>
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

					<FormLink to="/settings/deck">{{ i18n.ts.deck }}</FormLink>
					<FormLink to="/settings/custom-css"><template #icon><i class="ti ti-code"></i></template>{{ i18n.ts.customCss }}</FormLink>
				</div>
			</FormSection>
		</SearchMarker>
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
import { globalEvents } from '@/events.js';
import { claimAchievement } from '@/scripts/achievements.js';

const lang = ref(miLocalStorage.getItem('lang'));
const fontSize = ref(miLocalStorage.getItem('fontSize'));
const useSystemFont = ref(miLocalStorage.getItem('useSystemFont') != null);
const dataSaver = ref(defaultStore.state.dataSaver);

const hemisphere = computed(defaultStore.makeGetterSetter('hemisphere'));
const overridedDeviceKind = computed(defaultStore.makeGetterSetter('overridedDeviceKind'));
const serverDisconnectedBehavior = computed(defaultStore.makeGetterSetter('serverDisconnectedBehavior'));
const showNoteActionsOnlyHover = computed(defaultStore.makeGetterSetter('showNoteActionsOnlyHover'));
const showClipButtonInNoteFooter = computed(defaultStore.makeGetterSetter('showClipButtonInNoteFooter'));
const reactionsDisplaySize = computed(defaultStore.makeGetterSetter('reactionsDisplaySize'));
const limitWidthOfReaction = computed(defaultStore.makeGetterSetter('limitWidthOfReaction'));
const collapseRenotes = computed(defaultStore.makeGetterSetter('collapseRenotes'));
const reduceAnimation = computed(defaultStore.makeGetterSetter('animation', v => !v, v => !v));
const useBlurEffectForModal = computed(defaultStore.makeGetterSetter('useBlurEffectForModal'));
const useBlurEffect = computed(defaultStore.makeGetterSetter('useBlurEffect'));
const showGapBetweenNotesInTimeline = computed(defaultStore.makeGetterSetter('showGapBetweenNotesInTimeline'));
const animatedMfm = computed(defaultStore.makeGetterSetter('animatedMfm'));
const advancedMfm = computed(defaultStore.makeGetterSetter('advancedMfm'));
const showReactionsCount = computed(defaultStore.makeGetterSetter('showReactionsCount'));
const enableQuickAddMfmFunction = computed(defaultStore.makeGetterSetter('enableQuickAddMfmFunction'));
const emojiStyle = computed(defaultStore.makeGetterSetter('emojiStyle'));
const menuStyle = computed(defaultStore.makeGetterSetter('menuStyle'));
const disableShowingAnimatedImages = computed(defaultStore.makeGetterSetter('disableShowingAnimatedImages'));
const forceShowAds = computed(defaultStore.makeGetterSetter('forceShowAds'));
const loadRawImages = computed(defaultStore.makeGetterSetter('loadRawImages'));
const highlightSensitiveMedia = computed(defaultStore.makeGetterSetter('highlightSensitiveMedia'));
const imageNewTab = computed(defaultStore.makeGetterSetter('imageNewTab'));
const nsfw = computed(defaultStore.makeGetterSetter('nsfw'));
const showFixedPostForm = computed(defaultStore.makeGetterSetter('showFixedPostForm'));
const showFixedPostFormInChannel = computed(defaultStore.makeGetterSetter('showFixedPostFormInChannel'));
const numberOfPageCache = computed(defaultStore.makeGetterSetter('numberOfPageCache'));
const instanceTicker = computed(defaultStore.makeGetterSetter('instanceTicker'));
const enableInfiniteScroll = computed(defaultStore.makeGetterSetter('enableInfiniteScroll'));
const useReactionPickerForContextMenu = computed(defaultStore.makeGetterSetter('useReactionPickerForContextMenu'));
const squareAvatars = computed(defaultStore.makeGetterSetter('squareAvatars'));
const showAvatarDecorations = computed(defaultStore.makeGetterSetter('showAvatarDecorations'));
const mediaListWithOneImageAppearance = computed(defaultStore.makeGetterSetter('mediaListWithOneImageAppearance'));
const notificationPosition = computed(defaultStore.makeGetterSetter('notificationPosition'));
const notificationStackAxis = computed(defaultStore.makeGetterSetter('notificationStackAxis'));
const keepScreenOn = computed(defaultStore.makeGetterSetter('keepScreenOn'));
const disableStreamingTimeline = computed(defaultStore.makeGetterSetter('disableStreamingTimeline'));
const useGroupedNotifications = computed(defaultStore.makeGetterSetter('useGroupedNotifications'));
const enableSeasonalScreenEffect = computed(defaultStore.makeGetterSetter('enableSeasonalScreenEffect'));
const enableHorizontalSwipe = computed(defaultStore.makeGetterSetter('enableHorizontalSwipe'));
const useNativeUIForVideoAudioPlayer = computed(defaultStore.makeGetterSetter('useNativeUIForVideoAudioPlayer'));
const alwaysConfirmFollow = computed(defaultStore.makeGetterSetter('alwaysConfirmFollow'));
const confirmWhenRevealingSensitiveMedia = computed(defaultStore.makeGetterSetter('confirmWhenRevealingSensitiveMedia'));
const confirmOnReact = computed(defaultStore.makeGetterSetter('confirmOnReact'));
const contextMenu = computed(defaultStore.makeGetterSetter('contextMenu'));

watch(lang, () => {
	miLocalStorage.setItem('lang', lang.value as string);
	miLocalStorage.removeItem('locale');
	miLocalStorage.removeItem('localeVersion');
});

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
	hemisphere,
	lang,
	fontSize,
	useSystemFont,
	enableInfiniteScroll,
	squareAvatars,
	showNoteActionsOnlyHover,
	showGapBetweenNotesInTimeline,
	instanceTicker,
	overridedDeviceKind,
	mediaListWithOneImageAppearance,
	reactionsDisplaySize,
	limitWidthOfReaction,
	highlightSensitiveMedia,
	keepScreenOn,
	disableStreamingTimeline,
	enableSeasonalScreenEffect,
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
