/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Mfm from './global/MkMfm.js';
import MkA from './global/MkA.vue';
import MkAcct from './global/MkAcct.vue';
import MkAvatar from './global/MkAvatar.vue';
import MkEmoji from './global/MkEmoji.vue';
import MkCondensedLine from './global/MkCondensedLine.vue';
import MkCustomEmoji from './global/MkCustomEmoji.vue';
import MkUserName from './global/MkUserName.vue';
import MkEllipsis from './global/MkEllipsis.vue';
import MkTime from './global/MkTime.vue';
import MkUrl from './global/MkUrl.vue';
import I18n from './global/I18n.vue';
import RouterView from './global/RouterView.vue';
import NestedRouterView from './global/NestedRouterView.vue';
import StackingRouterView from './global/StackingRouterView.vue';
import MkLoading from './global/MkLoading.vue';
import MkError from './global/MkError.vue';
import MkSuspense from './global/MkSuspense.vue';
import MkAd from './global/MkAd.vue';
import MkPageHeader from './global/MkPageHeader.vue';
import MkStickyContainer from './global/MkStickyContainer.vue';
import MkLazy from './global/MkLazy.vue';
import MkResult from './global/MkResult.vue';
import MkSystemIcon from './global/MkSystemIcon.vue';
import MkTip from './global/MkTip.vue';
import PageWithHeader from './global/PageWithHeader.vue';
import PageWithAnimBg from './global/PageWithAnimBg.vue';
import SearchMarker from './global/SearchMarker.vue';
import SearchLabel from './global/SearchLabel.vue';
import SearchText from './global/SearchText.vue';
import SearchIcon from './global/SearchIcon.vue';

import type { App } from 'vue';

export default function(app: App) {
	for (const [key, value] of Object.entries(components)) {
		app.component(key, value);
	}
}

export const components = {
	I18n: I18n,
	RouterView: RouterView,
	NestedRouterView: NestedRouterView,
	StackingRouterView: StackingRouterView,
	Mfm: Mfm,
	MkA: MkA,
	MkAcct: MkAcct,
	MkAvatar: MkAvatar,
	MkEmoji: MkEmoji,
	MkCondensedLine: MkCondensedLine,
	MkCustomEmoji: MkCustomEmoji,
	MkUserName: MkUserName,
	MkEllipsis: MkEllipsis,
	MkTime: MkTime,
	MkUrl: MkUrl,
	MkLoading: MkLoading,
	MkError: MkError,
	MkSuspense: MkSuspense,
	MkAd: MkAd,
	MkPageHeader: MkPageHeader,
	MkStickyContainer: MkStickyContainer,
	MkLazy: MkLazy,
	MkResult: MkResult,
	MkSystemIcon: MkSystemIcon,
	MkTip: MkTip,
	PageWithHeader: PageWithHeader,
	PageWithAnimBg: PageWithAnimBg,
	SearchMarker: SearchMarker,
	SearchLabel: SearchLabel,
	SearchText: SearchText,
	SearchIcon: SearchIcon,
};

declare module 'vue' {
	export interface GlobalComponents {
		I18n: typeof I18n;
		RouterView: typeof RouterView;
		NestedRouterView: typeof NestedRouterView;
		StackingRouterView: typeof StackingRouterView;
		Mfm: typeof Mfm;
		MkA: typeof MkA;
		MkAcct: typeof MkAcct;
		MkAvatar: typeof MkAvatar;
		MkEmoji: typeof MkEmoji;
		MkCondensedLine: typeof MkCondensedLine;
		MkCustomEmoji: typeof MkCustomEmoji;
		MkUserName: typeof MkUserName;
		MkEllipsis: typeof MkEllipsis;
		MkTime: typeof MkTime;
		MkUrl: typeof MkUrl;
		MkLoading: typeof MkLoading;
		MkError: typeof MkError;
		MkSuspense: typeof MkSuspense;
		MkAd: typeof MkAd;
		MkPageHeader: typeof MkPageHeader;
		MkStickyContainer: typeof MkStickyContainer;
		MkLazy: typeof MkLazy;
		MkResult: typeof MkResult;
		MkSystemIcon: typeof MkSystemIcon;
		MkTip: typeof MkTip;
		PageWithHeader: typeof PageWithHeader;
		PageWithAnimBg: typeof PageWithAnimBg;
		SearchMarker: typeof SearchMarker;
		SearchLabel: typeof SearchLabel;
		SearchText: typeof SearchText;
		SearchIcon: typeof SearchIcon;
	}
}
