<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/preferences" :label="i18n.ts.preferences" :keywords="['general', 'preferences']" icon="ti ti-adjustments">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/gear_3d.png" color="#00ff9d">
			<SearchText>{{ i18n.ts._settings.preferencesBanner }}</SearchText>
		</MkFeatureBanner>

		<div class="_gaps_s">
			<SearchMarker v-slot="slotProps" :keywords="['general']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ i18n.ts.general }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-settings"></i></SearchIcon></template>

					<div class="_gaps_m">
						<SearchMarker :keywords="['language']">
							<MkSelect v-model="lang" :items="langs.map(x => ({ label: x[1], value: x[0] }))">
								<template #label><SearchLabel>{{ i18n.ts.uiLanguage }}</SearchLabel></template>
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
							<MkRadios
								v-model="overridedDeviceKind"
								:options="[
									{ value: null, label: i18n.ts.auto },
									{ value: 'smartphone', label: i18n.ts.smartphone, icon: 'ti ti-device-mobile' },
									{ value: 'tablet', label: i18n.ts.tablet, icon: 'ti ti-device-tablet' },
									{ value: 'desktop', label: i18n.ts.desktop, icon: 'ti ti-device-desktop' },
								]"
							>
								<template #label><SearchLabel>{{ i18n.ts.overridedDeviceKind }}</SearchLabel></template>
							</MkRadios>
						</SearchMarker>

						<SearchMarker :keywords="['realtimemode']">
							<MkSwitch v-model="realtimeMode">
								<template #label><i class="ti ti-bolt"></i> <SearchLabel>{{ i18n.ts.realtimeMode }}</SearchLabel></template>
								<template #caption><SearchText>{{ i18n.ts._settings.realtimeMode_description }}</SearchText></template>
							</MkSwitch>
						</SearchMarker>

						<MkDisableSection :disabled="realtimeMode">
							<SearchMarker :keywords="['polling', 'interval']">
								<MkPreferenceContainer k="pollingInterval">
									<MkRange v-model="pollingInterval" :min="1" :max="3" :step="1" easing :showTicks="true" :textConverter="(v) => v === 1 ? i18n.ts.low : v === 2 ? i18n.ts.middle : v === 3 ? i18n.ts.high : ''">
										<template #label><SearchLabel>{{ i18n.ts._settings.contentsUpdateFrequency }}</SearchLabel></template>
										<template #caption><SearchText>{{ i18n.ts._settings.contentsUpdateFrequency_description }}</SearchText><br><SearchText>{{ i18n.ts._settings.contentsUpdateFrequency_description2 }}</SearchText></template>
										<template #prefix><i class="ti ti-player-play"></i></template>
										<template #suffix><i class="ti ti-player-track-next"></i></template>
									</MkRange>
								</MkPreferenceContainer>
							</SearchMarker>
						</MkDisableSection>

						<div class="_gaps_s">
							<SearchMarker :keywords="['titlebar', 'show']">
								<MkPreferenceContainer k="showTitlebar">
									<MkSwitch v-model="showTitlebar">
										<template #label><SearchLabel>{{ i18n.ts.showTitlebar }}</SearchLabel></template>
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

							<SearchMarker :keywords="['mfm', 'enable', 'show', 'advanced']">
								<MkPreferenceContainer k="advancedMfm">
									<MkSwitch v-model="advancedMfm">
										<template #label><SearchLabel>{{ i18n.ts.enableAdvancedMfm }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['auto', 'load', 'auto', 'more', 'scroll']">
								<MkPreferenceContainer k="enableInfiniteScroll">
									<MkSwitch v-model="enableInfiniteScroll">
										<template #label><SearchLabel>{{ i18n.ts.enableInfiniteScroll }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

						<SearchMarker :keywords="['emoji', 'style', 'native', 'system', 'fluent', 'twemoji']">
							<MkPreferenceContainer k="emojiStyle">
								<div>
									<MkRadios
										v-model="emojiStyle"
										:options="[
											{ value: 'native', label: i18n.ts.native },
											{ value: 'fluentEmoji', label: 'Fluent Emoji' },
											{ value: 'twemoji', label: 'Twemoji' },
										]"
									>
										<template #label><SearchLabel>{{ i18n.ts.emojiStyle }}</SearchLabel></template>
									</MkRadios>
									<div style="margin: 8px 0 0 0; font-size: 1.5em;"><Mfm :key="emojiStyle" text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></div>
								</div>
							</MkPreferenceContainer>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['timeline', 'note']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ i18n.ts._settings.timelineAndNote }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-notes"></i></SearchIcon></template>

					<div class="_gaps_m">
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
										<template #caption><SearchText>{{ i18n.ts.collapseRenotesDescription }}</SearchText></template>
									</MkSwitch>
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

						<hr>

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

								<SearchMarker :keywords="['reaction', 'order']">
									<MkPreferenceContainer k="showAvailableReactionsFirstInNote">
										<MkSwitch v-model="showAvailableReactionsFirstInNote">
											<template #label><SearchLabel>{{ i18n.ts._settings.showAvailableReactionsFirstInNote }}</SearchLabel></template>
										</MkSwitch>
									</MkPreferenceContainer>
								</SearchMarker>
							</div>

							<SearchMarker :keywords="['reaction', 'size', 'scale', 'display']">
								<MkPreferenceContainer k="reactionsDisplaySize">
									<MkRadios
										v-model="reactionsDisplaySize"
										:options="[
											{ value: 'small', label: i18n.ts.small },
											{ value: 'medium', label: i18n.ts.medium },
											{ value: 'large', label: i18n.ts.large },
										]"
									>
										<template #label><SearchLabel>{{ i18n.ts.reactionsDisplaySize }}</SearchLabel></template>
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
									<MkRadios
										v-model="mediaListWithOneImageAppearance"
										:options="[
											{ value: 'expand', label: i18n.ts.default },
											{ value: '16_9', label: i18n.tsx.limitTo({ x: '16:9' }) },
											{ value: '1_1', label: i18n.tsx.limitTo({ x: '1:1' }) },
											{ value: '2_3', label: i18n.tsx.limitTo({ x: '2:3' }) },
										]"
									>
										<template #label><SearchLabel>{{ i18n.ts.mediaListWithOneImageAppearance }}</SearchLabel></template>
									</MkRadios>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['attachment', 'image', 'photo', 'picture', 'media', 'thumbnail', 'grid', 'wide', 'area']">
								<MkPreferenceContainer k="showMediaListByGridInWideArea">
									<MkSwitch v-model="showMediaListByGridInWideArea">
										<template #label><SearchLabel>{{ i18n.ts.showMediaListByGridInWideArea }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['ticker', 'information', 'label', 'instance', 'server', 'host', 'federation']">
								<MkPreferenceContainer k="instanceTicker">
									<MkSelect
										v-if="instance.federation !== 'none'"
										v-model="instanceTicker"
										:items="[
											{ label: i18n.ts._instanceTicker.none, value: 'none' },
											{ label: i18n.ts._instanceTicker.remote, value: 'remote' },
											{ label: i18n.ts._instanceTicker.always, value: 'always' },
										]"
									>
										<template #label><SearchLabel>{{ i18n.ts.instanceTicker }}</SearchLabel></template>
									</MkSelect>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['attachment', 'image', 'photo', 'picture', 'media', 'thumbnail', 'nsfw', 'sensitive', 'display', 'show', 'hide', 'visibility']">
								<MkPreferenceContainer k="nsfw">
									<MkSelect
										v-model="nsfw"
										:items="[
											{ label: i18n.ts._displayOfSensitiveMedia.respect, value: 'respect' },
											{ label: i18n.ts._displayOfSensitiveMedia.ignore, value: 'ignore' },
											{ label: i18n.ts._displayOfSensitiveMedia.force, value: 'force' },
										]"
									>
										<template #label><SearchLabel>{{ i18n.ts.displayOfSensitiveMedia }}</SearchLabel></template>
									</MkSelect>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['post', 'form']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ i18n.ts.postForm }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-edit"></i></SearchIcon></template>

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
											<MkSelect
												v-model="defaultNoteVisibility"
												:items="[
													{ label: i18n.ts._visibility.public, value: 'public' },
													{ label: i18n.ts._visibility.home, value: 'home' },
													{ label: i18n.ts._visibility.followers, value: 'followers' },
													{ label: i18n.ts._visibility.specified, value: 'specified' },
												]"
											>
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

			<SearchMarker v-slot="slotProps" :keywords="['notification']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ i18n.ts.notifications }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-bell"></i></SearchIcon></template>

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
								<MkRadios
									v-model="notificationPosition"
									:options="[
										{ value: 'leftTop', label: i18n.ts.leftTop, icon: 'ti ti-align-box-left-top' },
										{ value: 'rightTop', label: i18n.ts.rightTop, icon: 'ti ti-align-box-right-top' },
										{ value: 'leftBottom', label: i18n.ts.leftBottom, icon: 'ti ti-align-box-left-bottom' },
										{ value: 'rightBottom', label: i18n.ts.rightBottom, icon: 'ti ti-align-box-right-bottom' },
									]"
								>
									<template #label><SearchLabel>{{ i18n.ts.position }}</SearchLabel></template>
								</MkRadios>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['stack', 'axis', 'direction']">
							<MkPreferenceContainer k="notificationStackAxis">
								<MkRadios
									v-model="notificationStackAxis"
									:options="[
										{ value: 'vertical', label: i18n.ts.vertical, icon: 'ti ti-carousel-vertical' },
										{ value: 'horizontal', label: i18n.ts.horizontal, icon: 'ti ti-carousel-horizontal' },
									]"
								>
									<template #label><SearchLabel>{{ i18n.ts.stackAxis }}</SearchLabel></template>
								</MkRadios>
							</MkPreferenceContainer>
						</SearchMarker>

						<MkButton @click="testNotification">{{ i18n.ts._notification.checkNotificationBehavior }}</MkButton>
					</div>
				</MkFolder>
			</SearchMarker>

			<template v-if="$i.policies.chatAvailability !== 'unavailable'">
				<SearchMarker v-slot="slotProps" :keywords="['chat', 'messaging']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #label><SearchLabel>{{ i18n.ts.directMessage }}</SearchLabel></template>
						<template #icon><SearchIcon><i class="ti ti-messages"></i></SearchIcon></template>

						<div class="_gaps_s">
							<SearchMarker :keywords="['show', 'sender', 'name']">
								<MkPreferenceContainer k="chat.showSenderName">
									<MkSwitch v-model="chatShowSenderName">
										<template #label><SearchLabel>{{ i18n.ts._settings._chat.showSenderName }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['send', 'enter', 'newline']">
								<MkPreferenceContainer k="chat.sendOnEnter">
									<MkSwitch v-model="chatSendOnEnter">
										<template #label><SearchLabel>{{ i18n.ts._settings._chat.sendOnEnter }}</SearchLabel></template>
										<template #caption>
											<div class="_gaps_s">
												<div>
													<b>{{ i18n.ts._settings.ifOn }}:</b>
													<div>{{ i18n.ts._chat.send }}: Enter</div>
													<div>{{ i18n.ts._chat.newline }}: Shift + Enter</div>
												</div>
												<div>
													<b>{{ i18n.ts._settings.ifOff }}:</b>
													<div>{{ i18n.ts._chat.send }}: Ctrl + Enter</div>
													<div>{{ i18n.ts._chat.newline }}: Enter</div>
												</div>
											</div>
										</template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>
					</MkFolder>
				</SearchMarker>
			</template>

			<SearchMarker v-slot="slotProps" :keywords="['accessibility']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ i18n.ts.accessibility }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-accessible"></i></SearchIcon></template>

					<div class="_gaps_m">
						<MkFeatureBanner icon="/client-assets/mens_room_3d.png" color="#0011ff">
							<SearchText>{{ i18n.ts._settings.accessibilityBanner }}</SearchText>
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
										<template #caption>{{ i18n.ts.disableShowingAnimatedImages_caption }}</template>
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

							<SearchMarker :keywords="['tabs', 'tabbar', 'bottom', 'under']">
								<MkPreferenceContainer k="showPageTabBarBottom">
									<MkSwitch v-model="showPageTabBarBottom">
										<template #label><SearchLabel>{{ i18n.ts._settings.showPageTabBarBottom }}</SearchLabel></template>
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

							<SearchMarker :keywords="['swipe', 'pull', 'refresh']">
								<MkPreferenceContainer k="enablePullToRefresh">
									<MkSwitch v-model="enablePullToRefresh">
										<template #label><SearchLabel>{{ i18n.ts._settings.enablePullToRefresh }}</SearchLabel></template>
										<template #caption><SearchText>{{ i18n.ts._settings.enablePullToRefresh_description }}</SearchText></template>
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

							<SearchMarker :keywords="['text', 'selectable']">
								<MkPreferenceContainer k="makeEveryTextElementsSelectable">
									<MkSwitch v-model="makeEveryTextElementsSelectable">
										<template #label><SearchLabel>{{ i18n.ts._settings.makeEveryTextElementsSelectable }}</SearchLabel></template>
										<template #caption>{{ i18n.ts._settings.makeEveryTextElementsSelectable_description }}</template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

						<SearchMarker :keywords="['menu', 'style', 'popup', 'drawer']">
							<MkPreferenceContainer k="menuStyle">
								<MkSelect
									v-model="menuStyle"
									:items="[
										{ label: i18n.ts.auto, value: 'auto' },
										{ label: i18n.ts.popup, value: 'popup' },
										{ label: i18n.ts.drawer, value: 'drawer' },
									]"
								>
									<template #label><SearchLabel>{{ i18n.ts.menuStyle }}</SearchLabel></template>
								</MkSelect>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['contextmenu', 'system', 'native']">
							<MkPreferenceContainer k="contextMenu">
								<MkSelect
									v-model="contextMenu"
									:items="[
										{ label: i18n.ts._contextMenu.app, value: 'app' },
										{ label: i18n.ts._contextMenu.appWithShift, value: 'appWithShift' },
										{ label: i18n.ts._contextMenu.native, value: 'native' },
									]"
								>
									<template #label><SearchLabel>{{ i18n.ts._contextMenu.title }}</SearchLabel></template>
								</MkSelect>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['font', 'size']">
							<MkRadios
								v-model="fontSize"
								:options="[
									{ value: null, label: 'Aa', labelStyle: 'font-size: 14px;' },
									{ value: '1', label: 'Aa', labelStyle: 'font-size: 15px;' },
									{ value: '2', label: 'Aa', labelStyle: 'font-size: 16px;' },
									{ value: '3', label: 'Aa', labelStyle: 'font-size: 17px;' },
								]"
							>
								<template #label><SearchLabel>{{ i18n.ts.fontSize }}</SearchLabel></template>
							</MkRadios>
						</SearchMarker>

						<SearchMarker :keywords="['font', 'system', 'native']">
							<MkSwitch v-model="useSystemFont">
								<template #label><SearchLabel>{{ i18n.ts.useSystemFont }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['performance']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ i18n.ts.performance }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-battery-vertical-eco"></i></SearchIcon></template>

					<div class="_gaps_s">
						<SearchMarker :keywords="['animation', 'motion', 'reduce']">
							<MkPreferenceContainer k="animation">
								<MkSwitch :modelValue="!reduceAnimation" @update:modelValue="v => reduceAnimation = !v">
									<template #label><SearchLabel>{{ i18n.ts._settings.uiAnimations }}</SearchLabel></template>
									<template #caption><SearchText>{{ i18n.ts.turnOffToImprovePerformance }}</SearchText></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['animation', 'image', 'photo', 'picture', 'media', 'thumbnail', 'gif']">
							<MkPreferenceContainer k="disableShowingAnimatedImages">
								<MkSwitch :modelValue="!disableShowingAnimatedImages" @update:modelValue="v => disableShowingAnimatedImages = !v">
									<template #label><SearchLabel>{{ i18n.ts._settings.enableAnimatedImages }}</SearchLabel></template>
									<template #caption>
										<SearchText>{{ i18n.ts.turnOffToImprovePerformance }}</SearchText>
										<div>{{ i18n.ts.disableShowingAnimatedImages_caption }}</div>
									</template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['blur']">
							<MkPreferenceContainer k="useBlurEffect">
								<MkSwitch v-model="useBlurEffect">
									<template #label><SearchLabel>{{ i18n.ts.useBlurEffect }}</SearchLabel></template>
									<template #caption><SearchText>{{ i18n.ts.turnOffToImprovePerformance }}</SearchText></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['blur', 'modal']">
							<MkPreferenceContainer k="useBlurEffectForModal">
								<MkSwitch v-model="useBlurEffectForModal">
									<template #label><SearchLabel>{{ i18n.ts.useBlurEffectForModal }}</SearchLabel></template>
									<template #caption><SearchText>{{ i18n.ts.turnOffToImprovePerformance }}</SearchText></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['blurhash', 'image', 'photo', 'picture', 'thumbnail', 'placeholder']">
							<MkPreferenceContainer k="enableHighQualityImagePlaceholders">
								<MkSwitch v-model="enableHighQualityImagePlaceholders">
									<template #label><SearchLabel>{{ i18n.ts._settings.enableHighQualityImagePlaceholders }}</SearchLabel></template>
									<template #caption><SearchText>{{ i18n.ts.turnOffToImprovePerformance }}</SearchText></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['sticky']">
							<MkPreferenceContainer k="useStickyIcons">
								<MkSwitch v-model="useStickyIcons">
									<template #label><SearchLabel>{{ i18n.ts._settings.useStickyIcons }}</SearchLabel></template>
									<template #caption><SearchText>{{ i18n.ts.turnOffToImprovePerformance }}</SearchText></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<MkInfo>
							<div class="_gaps_s">
								<div>{{ i18n.ts._clientPerformanceIssueTip.title }}:</div>
								<div>
									<div><b>{{ i18n.ts._clientPerformanceIssueTip.makeSureDisabledAdBlocker }}</b></div>
									<div>{{ i18n.ts._clientPerformanceIssueTip.makeSureDisabledAdBlocker_description }}</div>
								</div>
								<div>
									<div><b>{{ i18n.ts._clientPerformanceIssueTip.makeSureDisabledCustomCss }}</b></div>
									<div>{{ i18n.ts._clientPerformanceIssueTip.makeSureDisabledCustomCss_description }}</div>
								</div>
								<div>
									<div><b>{{ i18n.ts._clientPerformanceIssueTip.makeSureDisabledAddons }}</b></div>
									<div>{{ i18n.ts._clientPerformanceIssueTip.makeSureDisabledAddons_description }}</div>
								</div>
							</div>
						</MkInfo>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['datasaver']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ i18n.ts.dataSaver }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-antenna-bars-3"></i></SearchIcon></template>

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
							<MkSwitch v-model="dataSaver.disableUrlPreview" :disabled="!instance.enableUrlPreview">
								{{ i18n.ts._dataSaver._disableUrlPreview.title }}
								<template #caption>{{ i18n.ts._dataSaver._disableUrlPreview.description }}</template>
							</MkSwitch>
							<MkSwitch v-model="dataSaver.urlPreviewThumbnail" :disabled="!instance.enableUrlPreview || dataSaver.disableUrlPreview">
								{{ i18n.ts._dataSaver._urlPreviewThumbnail.title }}
								<template #caption>{{ i18n.ts._dataSaver._urlPreviewThumbnail.description }}</template>
							</MkSwitch>
							<MkSwitch v-model="dataSaver.code">
								{{ i18n.ts._dataSaver._code.title }}
								<template #caption>{{ i18n.ts._dataSaver._code.description }}</template>
							</MkSwitch>
						</div>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['other']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ i18n.ts.other }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-settings-cog"></i></SearchIcon></template>

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

							<SearchMarker :keywords="['follow', 'replies']">
								<MkPreferenceContainer k="defaultFollowWithReplies">
									<MkSwitch v-model="defaultFollowWithReplies">
										<template #label><SearchLabel>{{ i18n.ts.withRepliesByDefaultForNewlyFollowed }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

						<SearchMarker :keywords="['server', 'disconnect', 'reconnect', 'reload', 'streaming']">
							<MkPreferenceContainer k="serverDisconnectedBehavior">
								<MkSelect
									v-model="serverDisconnectedBehavior"
									:items="[
										{ label: i18n.ts._serverDisconnectedBehavior.reload, value: 'reload' },
										{ label: i18n.ts._serverDisconnectedBehavior.dialog, value: 'dialog' },
										{ label: i18n.ts._serverDisconnectedBehavior.quiet, value: 'quiet' },
									]"
								>
									<template #label><SearchLabel>{{ i18n.ts.whenServerDisconnected }}</SearchLabel></template>
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
								<MkRadios
									v-model="hemisphere"
									:options="[
										{ value: 'N', label: i18n.ts._hemisphere.N },
										{ value: 'S', label: i18n.ts._hemisphere.S },
									]"
								>
									<template #label><SearchLabel>{{ i18n.ts.hemisphere }}</SearchLabel></template>
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
		</div>

		<hr>

		<div class="_gaps_s">
			<FormLink to="/settings/navbar"><template #icon><i class="ti ti-list"></i></template>{{ i18n.ts.navbar }}</FormLink>
			<FormLink to="/settings/statusbar"><template #icon><i class="ti ti-list"></i></template>{{ i18n.ts.statusbar }}</FormLink>
			<FormLink to="/settings/deck"><template #icon><i class="ti ti-columns"></i></template>{{ i18n.ts.deck }}</FormLink>
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
import MkDisableSection from '@/components/MkDisableSection.vue';
import FormLink from '@/components/form/link.vue';
import MkLink from '@/components/MkLink.vue';
import MkInfo from '@/components/MkInfo.vue';
import { store } from '@/store.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { miLocalStorage } from '@/local-storage.js';
import { prefer } from '@/preferences.js';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import { globalEvents } from '@/events.js';
import { claimAchievement } from '@/utility/achievements.js';
import { instance } from '@/instance.js';
import { ensureSignin } from '@/i.js';
import { genId } from '@/utility/id.js';
import { suggestReload } from '@/utility/reload-suggest.js';

const $i = ensureSignin();

const lang = ref(miLocalStorage.getItem('lang'));
const dataSaver = ref(prefer.s.dataSaver);
const realtimeMode = store.model('realtimeMode');

const overridedDeviceKind = prefer.model('overridedDeviceKind');
const pollingInterval = prefer.model('pollingInterval');
const showTitlebar = prefer.model('showTitlebar');
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
const showAvailableReactionsFirstInNote = prefer.model('showAvailableReactionsFirstInNote');
const useGroupedNotifications = prefer.model('useGroupedNotifications');
const alwaysConfirmFollow = prefer.model('alwaysConfirmFollow');
const confirmWhenRevealingSensitiveMedia = prefer.model('confirmWhenRevealingSensitiveMedia');
const confirmOnReact = prefer.model('confirmOnReact');
const defaultNoteVisibility = prefer.model('defaultNoteVisibility');
const defaultNoteLocalOnly = prefer.model('defaultNoteLocalOnly');
const rememberNoteVisibility = prefer.model('rememberNoteVisibility');
const notificationPosition = prefer.model('notificationPosition');
const notificationStackAxis = prefer.model('notificationStackAxis');
const instanceTicker = prefer.model('instanceTicker');
const highlightSensitiveMedia = prefer.model('highlightSensitiveMedia');
const mediaListWithOneImageAppearance = prefer.model('mediaListWithOneImageAppearance');
const showMediaListByGridInWideArea = prefer.model('showMediaListByGridInWideArea');
const reactionsDisplaySize = prefer.model('reactionsDisplaySize');
const limitWidthOfReaction = prefer.model('limitWidthOfReaction');
const squareAvatars = prefer.model('squareAvatars');
const enableSeasonalScreenEffect = prefer.model('enableSeasonalScreenEffect');
const showAvatarDecorations = prefer.model('showAvatarDecorations');
const nsfw = prefer.model('nsfw');
const emojiStyle = prefer.model('emojiStyle');
const useBlurEffectForModal = prefer.model('useBlurEffectForModal');
const useBlurEffect = prefer.model('useBlurEffect');
const defaultFollowWithReplies = prefer.model('defaultFollowWithReplies');
const chatShowSenderName = prefer.model('chat.showSenderName');
const chatSendOnEnter = prefer.model('chat.sendOnEnter');
const useStickyIcons = prefer.model('useStickyIcons');
const enableHighQualityImagePlaceholders = prefer.model('enableHighQualityImagePlaceholders');
const reduceAnimation = prefer.model('animation', v => !v, v => !v);
const animatedMfm = prefer.model('animatedMfm');
const disableShowingAnimatedImages = prefer.model('disableShowingAnimatedImages');
const keepScreenOn = prefer.model('keepScreenOn');
const enableHorizontalSwipe = prefer.model('enableHorizontalSwipe');
const showPageTabBarBottom = prefer.model('showPageTabBarBottom');
const enablePullToRefresh = prefer.model('enablePullToRefresh');
const useNativeUiForVideoAudioPlayer = prefer.model('useNativeUiForVideoAudioPlayer');
const contextMenu = prefer.model('contextMenu');
const menuStyle = prefer.model('menuStyle');
const makeEveryTextElementsSelectable = prefer.model('makeEveryTextElementsSelectable');

const fontSize = ref(miLocalStorage.getItem('fontSize') as '1' | '2' | '3' | null);
const useSystemFont = ref(miLocalStorage.getItem('useSystemFont') != null);

watch(lang, () => {
	miLocalStorage.setItem('lang', lang.value as string);
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
	realtimeMode,
	pollingInterval,
	enableInfiniteScroll,
	showNoteActionsOnlyHover,
	overridedDeviceKind,
	alwaysConfirmFollow,
	confirmWhenRevealingSensitiveMedia,
	mediaListWithOneImageAppearance,
	reactionsDisplaySize,
	limitWidthOfReaction,
	mediaListWithOneImageAppearance,
	limitWidthOfReaction,
	instanceTicker,
	squareAvatars,
	highlightSensitiveMedia,
	enableSeasonalScreenEffect,
	chatShowSenderName,
	useStickyIcons,
	enableHighQualityImagePlaceholders,
	disableShowingAnimatedImages,
	keepScreenOn,
	contextMenu,
	fontSize,
	useSystemFont,
	makeEveryTextElementsSelectable,
	enableHorizontalSwipe,
	showPageTabBarBottom,
	enablePullToRefresh,
	reduceAnimation,
	showAvailableReactionsFirstInNote,
	animatedMfm,
	advancedMfm,
], () => {
	suggestReload();
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
	const { canceled, result: listId } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map(x => ({
			value: x.id, label: x.name,
		})),
	});
	if (canceled || listId == null) return;

	prefer.commit('pinnedUserLists', [lists.find((x) => x.id === listId)!]);
}

function removePinnedList() {
	prefer.commit('pinnedUserLists', []);
}

function enableAllDataSaver() {
	const g = { ...prefer.s.dataSaver };

	(Object.keys(g) as (keyof typeof g)[]).forEach((key) => { g[key] = true; });

	dataSaver.value = g;
}

function disableAllDataSaver() {
	const g = { ...prefer.s.dataSaver };

	(Object.keys(g) as (keyof typeof g)[]).forEach((key) => { g[key] = false; });

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
		id: genId(),
		createdAt: new Date().toUTCString(),
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
		window.clearTimeout(smashTimer);
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
