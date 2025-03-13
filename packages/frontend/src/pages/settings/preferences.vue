<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/preferences" :label="i18n.ts.preferences" :keywords="['general', 'preferences']" icon="ti ti-adjustments">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/gear_3d.png" color="#00ff9d">
			<SearchKeyword>{{ i18n.ts._settings.preferencesBanner }}</SearchKeyword>
		</MkFeatureBanner>

		<div class="_gaps_s">
			<SearchMarker :keywords="['general']">
				<MkFolder>
					<template #label><SearchLabel>{{ i18n.ts.general }}</SearchLabel></template>

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

							<SearchMarker :keywords="['avatar', 'icon', 'decoration', 'show']">
								<MkPreferenceContainer k="showAvatarDecorations">
									<MkSwitch v-model="showAvatarDecorations">
										<template #label><SearchLabel>{{ i18n.ts.showAvatarDecorations }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['follow', 'confirm', 'always']">
								<MkPreferenceContainer k="alwaysConfirmFollow">
									<MkSwitch v-model="alwaysConfirmFollow">
										<template #label><SearchLabel>{{ i18n.ts.alwaysConfirmFollow }}</SearchLabel></template>
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

							<SearchMarker :keywords="['sensitive', 'nsfw', 'media', 'image', 'photo', 'picture', 'attachment', 'confirm']">
								<MkPreferenceContainer k="confirmWhenRevealingSensitiveMedia">
									<MkSwitch v-model="confirmWhenRevealingSensitiveMedia">
										<template #label><SearchLabel>{{ i18n.ts.confirmWhenRevealingSensitiveMedia }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

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

						<SearchMarker :keywords="['pinned', 'list']">
							<MkFolder>
								<template #label><SearchLabel>{{ i18n.ts.pinnedList }}</SearchLabel></template>
								<!-- 複数ピン止め管理できるようにしたいけどめんどいので一旦ひとつのみ -->
								<MkButton v-if="prefer.r.pinnedUserLists.value.length === 0" @click="setPinnedList()">{{ i18n.ts.add }}</MkButton>
								<MkButton v-else danger @click="removePinnedList()"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
							</MkFolder>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['timeline']">
				<MkFolder>
					<template #label><SearchLabel>{{ i18n.ts.timeline }}</SearchLabel></template>

					<div class="_gaps_s">
						<SearchMarker :keywords="['post', 'form', 'timeline']">
							<MkPreferenceContainer k="showFixedPostForm">
								<MkSwitch v-model="showFixedPostForm">
									<template #label><SearchLabel>{{ i18n.ts.showFixedPostForm }}</SearchLabel></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['post', 'form', 'timeline', 'channel']">
							<MkPreferenceContainer k="showFixedPostFormInChannel">
								<MkSwitch v-model="showFixedPostFormInChannel">
									<template #label><SearchLabel>{{ i18n.ts.showFixedPostFormInChannel }}</SearchLabel></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['renote']">
							<MkPreferenceContainer k="collapseRenotes">
								<MkSwitch v-model="collapseRenotes">
									<template #label><SearchLabel>{{ i18n.ts.collapseRenotes }}</SearchLabel></template>
									<template #caption><SearchKeyword>{{ i18n.ts.collapseRenotesDescription }}</SearchKeyword></template>
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

						<SearchMarker :keywords="['load', 'auto', 'more']">
							<MkPreferenceContainer k="enableInfiniteScroll">
								<MkSwitch v-model="enableInfiniteScroll">
									<template #label><SearchLabel>{{ i18n.ts.enableInfiniteScroll }}</SearchLabel></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['disable', 'streaming', 'timeline']">
							<MkPreferenceContainer k="disableStreamingTimeline">
								<MkSwitch v-model="disableStreamingTimeline">
									<template #label><SearchLabel>{{ i18n.ts.disableStreamingTimeline }}</SearchLabel></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['note']">
				<MkFolder>
					<template #label><SearchLabel>{{ i18n.ts.note }}</SearchLabel></template>

					<div class="_gaps_m">
						<div class="_gaps_s">
							<SearchMarker :keywords="['hover', 'show', 'footer', 'action']">
								<MkPreferenceContainer k="showNoteActionsOnlyHover">
									<MkSwitch v-model="showNoteActionsOnlyHover">
										<template #label><SearchLabel>{{ i18n.ts.showNoteActionsOnlyHover }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['footer', 'action', 'clip', 'show']">
								<MkPreferenceContainer k="showClipButtonInNoteFooter">
									<MkSwitch v-model="showClipButtonInNoteFooter">
										<template #label><SearchLabel>{{ i18n.ts.showClipButtonInNoteFooter }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['mfm', 'enable', 'show', 'advanced']">
								<MkPreferenceContainer k="advancedMfm">
									<MkSwitch v-model="advancedMfm">
										<template #label><SearchLabel>{{ i18n.ts.enableAdvancedMfm }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['reaction', 'count', 'show']">
								<MkPreferenceContainer k="showReactionsCount">
									<MkSwitch v-model="showReactionsCount">
										<template #label><SearchLabel>{{ i18n.ts.showReactionsCount }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['reaction', 'confirm']">
								<MkPreferenceContainer k="confirmOnReact">
									<MkSwitch v-model="confirmOnReact">
										<template #label><SearchLabel>{{ i18n.ts.confirmOnReact }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['image', 'photo', 'picture', 'media', 'thumbnail', 'quality', 'raw', 'attachment']">
								<MkPreferenceContainer k="loadRawImages">
									<MkSwitch v-model="loadRawImages">
										<template #label><SearchLabel>{{ i18n.ts.loadRawImages }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['reaction', 'picker', 'contextmenu', 'open']">
								<MkPreferenceContainer k="useReactionPickerForContextMenu">
									<MkSwitch v-model="useReactionPickerForContextMenu">
										<template #label><SearchLabel>{{ i18n.ts.useReactionPickerForContextMenu }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

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
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['post', 'form']">
				<MkFolder>
					<template #label><SearchLabel>{{ i18n.ts.postForm }}</SearchLabel></template>

					<div class="_gaps_m">
						<div class="_gaps_s">
							<SearchMarker :keywords="['remember', 'keep', 'note', 'cw']">
								<MkPreferenceContainer k="keepCw">
									<MkSwitch v-model="keepCw">
										<template #label><SearchLabel>{{ i18n.ts.keepCw }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['remember', 'keep', 'note', 'visibility']">
								<MkPreferenceContainer k="rememberNoteVisibility">
									<MkSwitch v-model="rememberNoteVisibility">
										<template #label><SearchLabel>{{ i18n.ts.rememberNoteVisibility }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['mfm', 'enable', 'show', 'advanced', 'picker', 'form', 'function', 'fn']">
								<MkPreferenceContainer k="enableQuickAddMfmFunction">
									<MkSwitch v-model="enableQuickAddMfmFunction">
										<template #label><SearchLabel>{{ i18n.ts.enableQuickAddMfmFunction }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

						<SearchMarker :keywords="['default', 'note', 'visibility']">
							<MkDisableSection :disabled="rememberNoteVisibility">
								<MkFolder>
									<template #label><SearchLabel>{{ i18n.ts.defaultNoteVisibility }}</SearchLabel></template>
									<template v-if="defaultNoteVisibility === 'public'" #suffix>{{ i18n.ts._visibility.public }}</template>
									<template v-else-if="defaultNoteVisibility === 'home'" #suffix>{{ i18n.ts._visibility.home }}</template>
									<template v-else-if="defaultNoteVisibility === 'followers'" #suffix>{{ i18n.ts._visibility.followers }}</template>
									<template v-else-if="defaultNoteVisibility === 'specified'" #suffix>{{ i18n.ts._visibility.specified }}</template>

									<div class="_gaps_m">
										<MkPreferenceContainer k="defaultNoteVisibility">
											<MkSelect v-model="defaultNoteVisibility">
												<option value="public">{{ i18n.ts._visibility.public }}</option>
												<option value="home">{{ i18n.ts._visibility.home }}</option>
												<option value="followers">{{ i18n.ts._visibility.followers }}</option>
												<option value="specified">{{ i18n.ts._visibility.specified }}</option>
											</MkSelect>
										</MkPreferenceContainer>

										<MkPreferenceContainer k="defaultNoteLocalOnly">
											<MkSwitch v-model="defaultNoteLocalOnly">{{ i18n.ts._visibility.disableFederation }}</MkSwitch>
										</MkPreferenceContainer>
									</div>
								</MkFolder>
							</MkDisableSection>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['notification']">
				<MkFolder>
					<template #label><SearchLabel>{{ i18n.ts.notifications }}</SearchLabel></template>

					<div class="_gaps_m">
						<SearchMarker :keywords="['group']">
							<MkPreferenceContainer k="useGroupedNotifications">
								<MkSwitch v-model="useGroupedNotifications">
									<template #label><SearchLabel>{{ i18n.ts.useGroupedNotifications }}</SearchLabel></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

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
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['other']">
				<MkFolder>
					<template #label><SearchLabel>{{ i18n.ts.other }}</SearchLabel></template>

					<div class="_gaps_m">
						<div class="_gaps_s">
							<SearchMarker :keywords="['avatar', 'icon', 'square']">
								<MkPreferenceContainer k="squareAvatars">
									<MkSwitch v-model="squareAvatars">
										<template #label><SearchLabel>{{ i18n.ts.squareAvatars }}</SearchLabel></template>
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

							<SearchMarker :keywords="['image', 'photo', 'picture', 'media', 'thumbnail', 'new', 'tab']">
								<MkPreferenceContainer k="imageNewTab">
									<MkSwitch v-model="imageNewTab">
										<template #label><SearchLabel>{{ i18n.ts.openImageInNewTab }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

						<SearchMarker :keywords="['server', 'disconnect', 'reconnect', 'reload', 'streaming']">
							<MkPreferenceContainer k="serverDisconnectedBehavior">
								<MkSelect v-model="serverDisconnectedBehavior">
									<template #label><SearchLabel>{{ i18n.ts.whenServerDisconnected }}</SearchLabel></template>
									<option value="reload">{{ i18n.ts._serverDisconnectedBehavior.reload }}</option>
									<option value="dialog">{{ i18n.ts._serverDisconnectedBehavior.dialog }}</option>
									<option value="quiet">{{ i18n.ts._serverDisconnectedBehavior.quiet }}</option>
								</MkSelect>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['cache', 'page']">
							<MkPreferenceContainer k="numberOfPageCache">
								<MkRange v-model="numberOfPageCache" :min="1" :max="10" :step="1" easing>
									<template #label><SearchLabel>{{ i18n.ts.numberOfPageCache }}</SearchLabel></template>
									<template #caption>{{ i18n.ts.numberOfPageCacheDescription }}</template>
								</MkRange>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['ad', 'show']">
							<MkPreferenceContainer k="forceShowAds">
								<MkSwitch v-model="forceShowAds">
									<template #label><SearchLabel>{{ i18n.ts.forceShowAds }}</SearchLabel></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker>
							<MkPreferenceContainer k="hemisphere">
								<MkRadios v-model="hemisphere">
									<template #label><SearchLabel>{{ i18n.ts.hemisphere }}</SearchLabel></template>
									<option value="N">{{ i18n.ts._hemisphere.N }}</option>
									<option value="S">{{ i18n.ts._hemisphere.S }}</option>
									<template #caption>{{ i18n.ts._hemisphere.caption }}</template>
								</MkRadios>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['emoji', 'dictionary', 'additional', 'extra']">
							<MkFolder>
								<template #label><SearchLabel>{{ i18n.ts.additionalEmojiDictionary }}</SearchLabel></template>
								<div class="_buttons">
									<template v-for="lang in emojiIndexLangs" :key="lang">
										<MkButton v-if="store.r.additionalUnicodeEmojiIndexes.value[lang]" danger @click="removeEmojiIndex(lang)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }} ({{ getEmojiIndexLangName(lang) }})</MkButton>
										<MkButton v-else @click="downloadEmojiIndex(lang)"><i class="ti ti-download"></i> {{ getEmojiIndexLangName(lang) }}{{ store.r.additionalUnicodeEmojiIndexes.value[lang] ? ` (${ i18n.ts.installed })` : '' }}</MkButton>
									</template>
								</div>
							</MkFolder>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['datasaver']">
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

			<FormLink to="/settings/navbar">{{ i18n.ts.navbar }}</FormLink>
			<FormLink to="/settings/statusbar">{{ i18n.ts.statusbar }}</FormLink>
			<FormLink to="/settings/deck">{{ i18n.ts.deck }}</FormLink>
			<FormLink to="/settings/custom-css"><template #icon><i class="ti ti-code"></i></template>{{ i18n.ts.customCss }}</FormLink>
		</div>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { langs } from '@@/js/config.js';
import * as Misskey from 'misskey-js';
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
import { store } from '@/store.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { reloadAsk } from '@/utility/reload-ask.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { miLocalStorage } from '@/local-storage.js';
import { prefer } from '@/preferences.js';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import { globalEvents } from '@/events.js';
import { claimAchievement } from '@/utility/achievements.js';
import { instance } from '@/instance.js';

const lang = ref(miLocalStorage.getItem('lang'));
const dataSaver = ref(prefer.s.dataSaver);

const overridedDeviceKind = prefer.model('overridedDeviceKind');
const keepCw = prefer.model('keepCw');
const serverDisconnectedBehavior = prefer.model('serverDisconnectedBehavior');
const hemisphere = prefer.model('hemisphere');
const showNoteActionsOnlyHover = prefer.model('showNoteActionsOnlyHover');
const showClipButtonInNoteFooter = prefer.model('showClipButtonInNoteFooter');
const collapseRenotes = prefer.model('collapseRenotes');
const advancedMfm = prefer.model('advancedMfm');
const showReactionsCount = prefer.model('showReactionsCount');
const enableQuickAddMfmFunction = prefer.model('enableQuickAddMfmFunction');
const forceShowAds = prefer.model('forceShowAds');
const loadRawImages = prefer.model('loadRawImages');
const imageNewTab = prefer.model('imageNewTab');
const showFixedPostForm = prefer.model('showFixedPostForm');
const showFixedPostFormInChannel = prefer.model('showFixedPostFormInChannel');
const numberOfPageCache = prefer.model('numberOfPageCache');
const enableInfiniteScroll = prefer.model('enableInfiniteScroll');
const useReactionPickerForContextMenu = prefer.model('useReactionPickerForContextMenu');
const disableStreamingTimeline = prefer.model('disableStreamingTimeline');
const useGroupedNotifications = prefer.model('useGroupedNotifications');
const alwaysConfirmFollow = prefer.model('alwaysConfirmFollow');
const confirmWhenRevealingSensitiveMedia = prefer.model('confirmWhenRevealingSensitiveMedia');
const confirmOnReact = prefer.model('confirmOnReact');
const defaultNoteVisibility = prefer.model('defaultNoteVisibility');
const defaultNoteLocalOnly = prefer.model('defaultNoteLocalOnly');
const rememberNoteVisibility = prefer.model('rememberNoteVisibility');
const showGapBetweenNotesInTimeline = prefer.model('showGapBetweenNotesInTimeline');
const notificationPosition = prefer.model('notificationPosition');
const notificationStackAxis = prefer.model('notificationStackAxis');
const instanceTicker = prefer.model('instanceTicker');
const highlightSensitiveMedia = prefer.model('highlightSensitiveMedia');
const mediaListWithOneImageAppearance = prefer.model('mediaListWithOneImageAppearance');
const reactionsDisplaySize = prefer.model('reactionsDisplaySize');
const limitWidthOfReaction = prefer.model('limitWidthOfReaction');
const squareAvatars = prefer.model('squareAvatars');
const enableSeasonalScreenEffect = prefer.model('enableSeasonalScreenEffect');
const showAvatarDecorations = prefer.model('showAvatarDecorations');
const nsfw = prefer.model('nsfw');
const emojiStyle = prefer.model('emojiStyle');
const useBlurEffectForModal = prefer.model('useBlurEffectForModal');
const useBlurEffect = prefer.model('useBlurEffect');

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
	showGapBetweenNotesInTimeline,
	mediaListWithOneImageAppearance,
	reactionsDisplaySize,
	limitWidthOfReaction,
	mediaListWithOneImageAppearance,
	reactionsDisplaySize,
	limitWidthOfReaction,
	instanceTicker,
	squareAvatars,
	highlightSensitiveMedia,
	enableSeasonalScreenEffect,
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
		const currentIndexes = store.s.additionalUnicodeEmojiIndexes;

		function download() {
			switch (lang) {
				case 'en-US': return import('../../unicode-emoji-indexes/en-US.json').then(x => x.default);
				case 'ja-JP': return import('../../unicode-emoji-indexes/ja-JP.json').then(x => x.default);
				case 'ja-JP_hira': return import('../../unicode-emoji-indexes/ja-JP_hira.json').then(x => x.default);
				default: throw new Error('unrecognized lang: ' + lang);
			}
		}

		currentIndexes[lang] = await download();
		await store.set('additionalUnicodeEmojiIndexes', currentIndexes);
	}

	os.promiseDialog(main());
}

function removeEmojiIndex(lang: string) {
	async function main() {
		const currentIndexes = store.s.additionalUnicodeEmojiIndexes;
		delete currentIndexes[lang];
		await store.set('additionalUnicodeEmojiIndexes', currentIndexes);
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
	if (list == null) return;

	prefer.commit('pinnedUserLists', [list]);
}

function removePinnedList() {
	prefer.commit('pinnedUserLists', []);
}

function enableAllDataSaver() {
	const g = { ...prefer.s.dataSaver };

	Object.keys(g).forEach((key) => { g[key] = true; });

	dataSaver.value = g;
}

function disableAllDataSaver() {
	const g = { ...prefer.s.dataSaver };

	Object.keys(g).forEach((key) => { g[key] = false; });

	dataSaver.value = g;
}

watch(dataSaver, (to) => {
	prefer.commit('dataSaver', to);
}, {
	deep: true,
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

definePage(() => ({
	title: i18n.ts.general,
	icon: 'ti ti-adjustments',
}));
</script>
