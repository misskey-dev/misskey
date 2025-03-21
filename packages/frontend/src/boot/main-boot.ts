/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp, defineAsyncComponent, markRaw } from 'vue';
import { ui } from '@@/js/config.js';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import { compareVersions } from 'compare-versions';
import { common } from './common.js';
import type { Component } from 'vue';
import type { Keymap } from '@/utility/hotkey.js';
import type { DeckProfile } from '@/deck.js';
import { i18n } from '@/i18n.js';
import { alert, confirm, popup, post, toast } from '@/os.js';
import { useStream } from '@/stream.js';
import * as sound from '@/utility/sound.js';
import { $i } from '@/i.js';
import { instance } from '@/instance.js';
import { ColdDeviceStorage, store } from '@/store.js';
import { reactionPicker } from '@/utility/reaction-picker.js';
import { miLocalStorage } from '@/local-storage.js';
import { claimAchievement, claimedAchievements } from '@/utility/achievements.js';
import { initializeSw } from '@/utility/initialize-sw.js';
import { emojiPicker } from '@/utility/emoji-picker.js';
import { mainRouter } from '@/router.js';
import { makeHotkey } from '@/utility/hotkey.js';
import { addCustomEmoji, removeCustomEmojis, updateCustomEmojis } from '@/custom-emojis.js';
import { prefer } from '@/preferences.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { deckStore } from '@/ui/deck/deck-store.js';
import { launchPlugins } from '@/plugin.js';
import { unisonReload } from '@/utility/unison-reload.js';
import { updateCurrentAccountPartial } from '@/accounts.js';
import { signout } from '@/signout.js';

export async function mainBoot() {
	const { isClientUpdated, lastVersion } = await common(() => {
		let uiStyle = ui;
		const searchParams = new URLSearchParams(window.location.search);

		if (!$i) uiStyle = 'visitor';

		if (searchParams.has('zen')) uiStyle = 'zen';
		if (uiStyle === 'deck' && prefer.s['deck.useSimpleUiForNonRootPages'] && window.location.pathname !== '/') uiStyle = 'zen';

		if (searchParams.has('ui')) uiStyle = searchParams.get('ui');

		let rootComponent: Component;
		switch (uiStyle) {
			case 'zen':
				rootComponent = defineAsyncComponent(() => import('@/ui/zen.vue'));
				break;
			case 'deck':
				rootComponent = defineAsyncComponent(() => import('@/ui/deck.vue'));
				break;
			case 'visitor':
				rootComponent = defineAsyncComponent(() => import('@/ui/visitor.vue'));
				break;
			case 'classic':
				rootComponent = defineAsyncComponent(() => import('@/ui/classic.vue'));
				break;
			default:
				rootComponent = defineAsyncComponent(() => import('@/ui/universal.vue'));
				break;
		}

		return createApp(rootComponent);
	});

	reactionPicker.init();
	emojiPicker.init();

	if (isClientUpdated && $i) {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkUpdated.vue')), {}, {
			closed: () => dispose(),
		});

		// prefereces migration
		// TODO: そのうち消す
		if (lastVersion && (compareVersions('2025.3.2-alpha.0', lastVersion) === 1)) {
			console.log('Preferences migration');

			store.loaded.then(async () => {
				const themes = await misskeyApi('i/registry/get', { scope: ['client'], key: 'themes' }).catch(() => []);
				if (themes.length > 0) {
					prefer.commit('themes', themes);
				}

				const plugins = ColdDeviceStorage.get('plugins');
				prefer.commit('plugins', plugins.map(p => ({
					...p,
					installId: (p as any).id,
					id: undefined,
				})));

				prefer.commit('deck.profile', deckStore.s.profile);
				misskeyApi('i/registry/keys', {
					scope: ['client', 'deck', 'profiles'],
				}).then(async keys => {
					const profiles: DeckProfile[] = [];
					for (const key of keys) {
						const deck = await misskeyApi('i/registry/get', {
							scope: ['client', 'deck', 'profiles'],
							key: key,
						});
						profiles.push({
							id: uuid(),
							name: key,
							columns: deck.columns,
							layout: deck.layout,
						});
					}
					prefer.commit('deck.profiles', profiles);
				});

				prefer.commit('lightTheme', ColdDeviceStorage.get('lightTheme'));
				prefer.commit('darkTheme', ColdDeviceStorage.get('darkTheme'));
				prefer.commit('syncDeviceDarkMode', ColdDeviceStorage.get('syncDeviceDarkMode'));
				prefer.commit('emojiPalettes', [{
					id: 'reactions',
					name: '',
					emojis: store.s.reactions,
				}, {
					id: 'pinnedEmojis',
					name: '',
					emojis: store.s.pinnedEmojis,
				}]);
				prefer.commit('emojiPaletteForMain', 'pinnedEmojis');
				prefer.commit('emojiPaletteForReaction', 'reactions');
				prefer.commit('overridedDeviceKind', store.s.overridedDeviceKind);
				prefer.commit('widgets', store.s.widgets);
				prefer.commit('keepCw', store.s.keepCw);
				prefer.commit('collapseRenotes', store.s.collapseRenotes);
				prefer.commit('rememberNoteVisibility', store.s.rememberNoteVisibility);
				prefer.commit('uploadFolder', store.s.uploadFolder);
				prefer.commit('keepOriginalUploading', store.s.keepOriginalUploading);
				prefer.commit('menu', store.s.menu);
				prefer.commit('statusbars', store.s.statusbars);
				prefer.commit('pinnedUserLists', store.s.pinnedUserLists);
				prefer.commit('serverDisconnectedBehavior', store.s.serverDisconnectedBehavior);
				prefer.commit('nsfw', store.s.nsfw);
				prefer.commit('highlightSensitiveMedia', store.s.highlightSensitiveMedia);
				prefer.commit('animation', store.s.animation);
				prefer.commit('animatedMfm', store.s.animatedMfm);
				prefer.commit('advancedMfm', store.s.advancedMfm);
				prefer.commit('showReactionsCount', store.s.showReactionsCount);
				prefer.commit('enableQuickAddMfmFunction', store.s.enableQuickAddMfmFunction);
				prefer.commit('loadRawImages', store.s.loadRawImages);
				prefer.commit('imageNewTab', store.s.imageNewTab);
				prefer.commit('disableShowingAnimatedImages', store.s.disableShowingAnimatedImages);
				prefer.commit('emojiStyle', store.s.emojiStyle);
				prefer.commit('menuStyle', store.s.menuStyle);
				prefer.commit('useBlurEffectForModal', store.s.useBlurEffectForModal);
				prefer.commit('useBlurEffect', store.s.useBlurEffect);
				prefer.commit('showFixedPostForm', store.s.showFixedPostForm);
				prefer.commit('showFixedPostFormInChannel', store.s.showFixedPostFormInChannel);
				prefer.commit('enableInfiniteScroll', store.s.enableInfiniteScroll);
				prefer.commit('useReactionPickerForContextMenu', store.s.useReactionPickerForContextMenu);
				prefer.commit('showGapBetweenNotesInTimeline', store.s.showGapBetweenNotesInTimeline);
				prefer.commit('instanceTicker', store.s.instanceTicker);
				prefer.commit('emojiPickerScale', store.s.emojiPickerScale);
				prefer.commit('emojiPickerWidth', store.s.emojiPickerWidth);
				prefer.commit('emojiPickerHeight', store.s.emojiPickerHeight);
				prefer.commit('emojiPickerStyle', store.s.emojiPickerStyle);
				prefer.commit('reportError', store.s.reportError);
				prefer.commit('squareAvatars', store.s.squareAvatars);
				prefer.commit('showAvatarDecorations', store.s.showAvatarDecorations);
				prefer.commit('numberOfPageCache', store.s.numberOfPageCache);
				prefer.commit('showNoteActionsOnlyHover', store.s.showNoteActionsOnlyHover);
				prefer.commit('showClipButtonInNoteFooter', store.s.showClipButtonInNoteFooter);
				prefer.commit('reactionsDisplaySize', store.s.reactionsDisplaySize);
				prefer.commit('limitWidthOfReaction', store.s.limitWidthOfReaction);
				prefer.commit('forceShowAds', store.s.forceShowAds);
				prefer.commit('aiChanMode', store.s.aiChanMode);
				prefer.commit('devMode', store.s.devMode);
				prefer.commit('mediaListWithOneImageAppearance', store.s.mediaListWithOneImageAppearance);
				prefer.commit('notificationPosition', store.s.notificationPosition);
				prefer.commit('notificationStackAxis', store.s.notificationStackAxis);
				prefer.commit('enableCondensedLine', store.s.enableCondensedLine);
				prefer.commit('keepScreenOn', store.s.keepScreenOn);
				prefer.commit('disableStreamingTimeline', store.s.disableStreamingTimeline);
				prefer.commit('useGroupedNotifications', store.s.useGroupedNotifications);
				prefer.commit('dataSaver', store.s.dataSaver);
				prefer.commit('enableSeasonalScreenEffect', store.s.enableSeasonalScreenEffect);
				prefer.commit('enableHorizontalSwipe', store.s.enableHorizontalSwipe);
				prefer.commit('useNativeUiForVideoAudioPlayer', store.s.useNativeUIForVideoAudioPlayer);
				prefer.commit('keepOriginalFilename', store.s.keepOriginalFilename);
				prefer.commit('alwaysConfirmFollow', store.s.alwaysConfirmFollow);
				prefer.commit('confirmWhenRevealingSensitiveMedia', store.s.confirmWhenRevealingSensitiveMedia);
				prefer.commit('contextMenu', store.s.contextMenu);
				prefer.commit('skipNoteRender', store.s.skipNoteRender);
				prefer.commit('showSoftWordMutedWord', store.s.showSoftWordMutedWord);
				prefer.commit('confirmOnReact', store.s.confirmOnReact);
				prefer.commit('defaultFollowWithReplies', store.s.defaultWithReplies);
				prefer.commit('sound.masterVolume', store.s.sound_masterVolume);
				prefer.commit('sound.notUseSound', store.s.sound_notUseSound);
				prefer.commit('sound.useSoundOnlyWhenActive', store.s.sound_useSoundOnlyWhenActive);
				prefer.commit('sound.on.note', store.s.sound_note as any);
				prefer.commit('sound.on.noteMy', store.s.sound_noteMy as any);
				prefer.commit('sound.on.notification', store.s.sound_notification as any);
				prefer.commit('sound.on.reaction', store.s.sound_reaction as any);
				prefer.commit('defaultNoteVisibility', store.s.defaultNoteVisibility);
				prefer.commit('defaultNoteLocalOnly', store.s.defaultNoteLocalOnly);

				window.setTimeout(() => {
					unisonReload();
				}, 5000);
			});
		}
	}

	const stream = useStream();

	let reloadDialogShowing = false;
	stream.on('_disconnected_', async () => {
		if (prefer.s.serverDisconnectedBehavior === 'reload') {
			window.location.reload();
		} else if (prefer.s.serverDisconnectedBehavior === 'dialog') {
			if (reloadDialogShowing) return;
			reloadDialogShowing = true;
			const { canceled } = await confirm({
				type: 'warning',
				title: i18n.ts.disconnectedFromServer,
				text: i18n.ts.reloadConfirm,
			});
			reloadDialogShowing = false;
			if (!canceled) {
				window.location.reload();
			}
		}
	});

	stream.on('emojiAdded', emojiData => {
		addCustomEmoji(emojiData.emoji);
	});

	stream.on('emojiUpdated', emojiData => {
		updateCustomEmojis(emojiData.emojis);
	});

	stream.on('emojiDeleted', emojiData => {
		removeCustomEmojis(emojiData.emojis);
	});

	launchPlugins();

	try {
		if (prefer.s.enableSeasonalScreenEffect) {
			const month = new Date().getMonth() + 1;
			if (prefer.s.hemisphere === 'S') {
				// ▼南半球
				if (month === 7 || month === 8) {
					const SnowfallEffect = (await import('@/utility/snowfall-effect.js')).SnowfallEffect;
					new SnowfallEffect({}).render();
				}
			} else {
				// ▼北半球
				if (month === 12 || month === 1) {
					const SnowfallEffect = (await import('@/utility/snowfall-effect.js')).SnowfallEffect;
					new SnowfallEffect({}).render();
				} else if (month === 3 || month === 4) {
					const SakuraEffect = (await import('@/utility/snowfall-effect.js')).SnowfallEffect;
					new SakuraEffect({
						sakura: true,
					}).render();
				}
			}
		}
	} catch (error) {
		// console.error(error);
		console.error('Failed to initialise the seasonal screen effect canvas context:', error);
	}

	if ($i) {
		store.loaded.then(async () => {
			if (store.s.accountSetupWizard !== -1) {
				const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkUserSetupDialog.vue')), {}, {
					closed: () => dispose(),
				});
			}
		});

		for (const announcement of ($i.unreadAnnouncements ?? []).filter(x => x.display === 'dialog')) {
			const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkAnnouncementDialog.vue')), {
				announcement,
			}, {
				closed: () => dispose(),
			});
		}

		function onAnnouncementCreated(ev: { announcement: Misskey.entities.Announcement }) {
			const announcement = ev.announcement;
			if (announcement.display === 'dialog') {
				const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkAnnouncementDialog.vue')), {
					announcement,
				}, {
					closed: () => dispose(),
				});
			}
		}

		stream.on('announcementCreated', onAnnouncementCreated);

		if ($i.isDeleted) {
			alert({
				type: 'warning',
				text: i18n.ts.accountDeletionInProgress,
			});
		}

		const now = new Date();
		const m = now.getMonth() + 1;
		const d = now.getDate();

		if ($i.birthday) {
			const bm = parseInt($i.birthday.split('-')[1]);
			const bd = parseInt($i.birthday.split('-')[2]);
			if (m === bm && d === bd) {
				claimAchievement('loggedInOnBirthday');
			}
		}

		if (m === 1 && d === 1) {
			claimAchievement('loggedInOnNewYearsDay');
		}

		if ($i.loggedInDays >= 3) claimAchievement('login3');
		if ($i.loggedInDays >= 7) claimAchievement('login7');
		if ($i.loggedInDays >= 15) claimAchievement('login15');
		if ($i.loggedInDays >= 30) claimAchievement('login30');
		if ($i.loggedInDays >= 60) claimAchievement('login60');
		if ($i.loggedInDays >= 100) claimAchievement('login100');
		if ($i.loggedInDays >= 200) claimAchievement('login200');
		if ($i.loggedInDays >= 300) claimAchievement('login300');
		if ($i.loggedInDays >= 400) claimAchievement('login400');
		if ($i.loggedInDays >= 500) claimAchievement('login500');
		if ($i.loggedInDays >= 600) claimAchievement('login600');
		if ($i.loggedInDays >= 700) claimAchievement('login700');
		if ($i.loggedInDays >= 800) claimAchievement('login800');
		if ($i.loggedInDays >= 900) claimAchievement('login900');
		if ($i.loggedInDays >= 1000) claimAchievement('login1000');

		if ($i.notesCount > 0) claimAchievement('notes1');
		if ($i.notesCount >= 10) claimAchievement('notes10');
		if ($i.notesCount >= 100) claimAchievement('notes100');
		if ($i.notesCount >= 500) claimAchievement('notes500');
		if ($i.notesCount >= 1000) claimAchievement('notes1000');
		if ($i.notesCount >= 5000) claimAchievement('notes5000');
		if ($i.notesCount >= 10000) claimAchievement('notes10000');
		if ($i.notesCount >= 20000) claimAchievement('notes20000');
		if ($i.notesCount >= 30000) claimAchievement('notes30000');
		if ($i.notesCount >= 40000) claimAchievement('notes40000');
		if ($i.notesCount >= 50000) claimAchievement('notes50000');
		if ($i.notesCount >= 60000) claimAchievement('notes60000');
		if ($i.notesCount >= 70000) claimAchievement('notes70000');
		if ($i.notesCount >= 80000) claimAchievement('notes80000');
		if ($i.notesCount >= 90000) claimAchievement('notes90000');
		if ($i.notesCount >= 100000) claimAchievement('notes100000');

		if ($i.followersCount > 0) claimAchievement('followers1');
		if ($i.followersCount >= 10) claimAchievement('followers10');
		if ($i.followersCount >= 50) claimAchievement('followers50');
		if ($i.followersCount >= 100) claimAchievement('followers100');
		if ($i.followersCount >= 300) claimAchievement('followers300');
		if ($i.followersCount >= 500) claimAchievement('followers500');
		if ($i.followersCount >= 1000) claimAchievement('followers1000');

		const createdAt = new Date($i.createdAt);
		const createdAtThreeYearsLater = new Date($i.createdAt);
		createdAtThreeYearsLater.setFullYear(createdAtThreeYearsLater.getFullYear() + 3);
		if (now >= createdAtThreeYearsLater) {
			claimAchievement('passedSinceAccountCreated3');
			claimAchievement('passedSinceAccountCreated2');
			claimAchievement('passedSinceAccountCreated1');
		} else {
			const createdAtTwoYearsLater = new Date($i.createdAt);
			createdAtTwoYearsLater.setFullYear(createdAtTwoYearsLater.getFullYear() + 2);
			if (now >= createdAtTwoYearsLater) {
				claimAchievement('passedSinceAccountCreated2');
				claimAchievement('passedSinceAccountCreated1');
			} else {
				const createdAtOneYearLater = new Date($i.createdAt);
				createdAtOneYearLater.setFullYear(createdAtOneYearLater.getFullYear() + 1);
				if (now >= createdAtOneYearLater) {
					claimAchievement('passedSinceAccountCreated1');
				}
			}
		}

		if (claimedAchievements.length >= 30) {
			claimAchievement('collectAchievements30');
		}

		if (!claimedAchievements.includes('justPlainLucky')) {
			let justPlainLuckyTimer: number | null = null;
			let lastVisibilityChangedAt = Date.now();

			function claimPlainLucky() {
				if (window.document.visibilityState !== 'visible') {
					if (justPlainLuckyTimer != null) window.clearTimeout(justPlainLuckyTimer);
					return;
				}

				if (Math.floor(Math.random() * 20000) === 0) {
					claimAchievement('justPlainLucky');
				} else {
					justPlainLuckyTimer = window.setTimeout(claimPlainLucky, 1000 * 10);
				}
			}

			window.addEventListener('visibilitychange', () => {
				const now = Date.now();

				if (window.document.visibilityState === 'visible') {
					// タブを高速で切り替えたら取得処理が何度も走るのを防ぐ
					if ((now - lastVisibilityChangedAt) < 1000 * 10) {
						justPlainLuckyTimer = window.setTimeout(claimPlainLucky, 1000 * 10);
					} else {
						claimPlainLucky();
					}
				} else if (justPlainLuckyTimer != null) {
					window.clearTimeout(justPlainLuckyTimer);
					justPlainLuckyTimer = null;
				}

				lastVisibilityChangedAt = now;
			}, { passive: true });

			claimPlainLucky();
		}

		if (!claimedAchievements.includes('client30min')) {
			window.setTimeout(() => {
				claimAchievement('client30min');
			}, 1000 * 60 * 30);
		}

		if (!claimedAchievements.includes('client60min')) {
			window.setTimeout(() => {
				claimAchievement('client60min');
			}, 1000 * 60 * 60);
		}

		// 邪魔
		//const lastUsed = miLocalStorage.getItem('lastUsed');
		//if (lastUsed) {
		//	const lastUsedDate = parseInt(lastUsed, 10);
		//	// 二時間以上前なら
		//	if (Date.now() - lastUsedDate > 1000 * 60 * 60 * 2) {
		//		toast(i18n.tsx.welcomeBackWithName({
		//			name: $i.name || $i.username,
		//		}));
		//	}
		//}
		//miLocalStorage.setItem('lastUsed', Date.now().toString());

		const latestDonationInfoShownAt = miLocalStorage.getItem('latestDonationInfoShownAt');
		const neverShowDonationInfo = miLocalStorage.getItem('neverShowDonationInfo');
		if (neverShowDonationInfo !== 'true' && (createdAt.getTime() < (Date.now() - (1000 * 60 * 60 * 24 * 3))) && !window.location.pathname.startsWith('/miauth')) {
			if (latestDonationInfoShownAt == null || (new Date(latestDonationInfoShownAt).getTime() < (Date.now() - (1000 * 60 * 60 * 24 * 30)))) {
				const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkDonation.vue')), {}, {
					closed: () => dispose(),
				});
			}
		}

		const modifiedVersionMustProminentlyOfferInAgplV3Section13Read = miLocalStorage.getItem('modifiedVersionMustProminentlyOfferInAgplV3Section13Read');
		if (modifiedVersionMustProminentlyOfferInAgplV3Section13Read !== 'true' && instance.repositoryUrl !== 'https://github.com/misskey-dev/misskey') {
			const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkSourceCodeAvailablePopup.vue')), {}, {
				closed: () => dispose(),
			});
		}

		if ('Notification' in window) {
			// 許可を得ていなかったらリクエスト
			if (Notification.permission === 'default') {
				Notification.requestPermission();
			}
		}

		const main = markRaw(stream.useChannel('main', null, 'System'));

		// 自分の情報が更新されたとき
		main.on('meUpdated', i => {
			updateCurrentAccountPartial(i);
		});

		main.on('readAllNotifications', () => {
			updateCurrentAccountPartial({
				hasUnreadNotification: false,
				unreadNotificationsCount: 0,
			});
		});

		main.on('unreadNotification', () => {
			const unreadNotificationsCount = ($i?.unreadNotificationsCount ?? 0) + 1;
			updateCurrentAccountPartial({
				hasUnreadNotification: true,
				unreadNotificationsCount,
			});
		});

		main.on('unreadMention', () => {
			updateCurrentAccountPartial({ hasUnreadMentions: true });
		});

		main.on('readAllUnreadMentions', () => {
			updateCurrentAccountPartial({ hasUnreadMentions: false });
		});

		main.on('unreadSpecifiedNote', () => {
			updateCurrentAccountPartial({ hasUnreadSpecifiedNotes: true });
		});

		main.on('readAllUnreadSpecifiedNotes', () => {
			updateCurrentAccountPartial({ hasUnreadSpecifiedNotes: false });
		});

		main.on('readAllAntennas', () => {
			updateCurrentAccountPartial({ hasUnreadAntenna: false });
		});

		main.on('unreadAntenna', () => {
			updateCurrentAccountPartial({ hasUnreadAntenna: true });
			sound.playMisskeySfx('antenna');
		});

		main.on('readAllAnnouncements', () => {
			updateCurrentAccountPartial({ hasUnreadAnnouncement: false });
		});

		// 個人宛てお知らせが発行されたとき
		main.on('announcementCreated', onAnnouncementCreated);

		// トークンが再生成されたとき
		// このままではMisskeyが利用できないので強制的にサインアウトさせる
		main.on('myTokenRegenerated', () => {
			signout();
		});
	}

	// shortcut
	const keymap = {
		'p|n': () => {
			if ($i == null) return;
			post();
		},
		'd': () => {
			store.set('darkMode', !store.s.darkMode);
		},
		's': () => {
			mainRouter.push('/search');
		},
	} as const satisfies Keymap;
	window.document.addEventListener('keydown', makeHotkey(keymap), { passive: false });

	initializeSw();
}
