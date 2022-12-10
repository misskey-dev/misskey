/// <reference types="vue/macros-global" />

declare module '*.vue' {
	import type { DefineComponent } from 'vue';
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

import Mfm from '@/components/global/MkMisskeyFlavoredMarkdown.vue';
import MkA from '@/components/global/MkA.vue';
import MkAcct from '@/components/global/MkAcct.vue';
import MkAvatar from '@/components/global/MkAvatar.vue';
import MkEmoji from '@/components/global/MkEmoji.vue';
import MkUserName from '@/components/global/MkUserName.vue';
import MkEllipsis from '@/components/global/MkEllipsis.vue';
import MkTime from '@/components/global/MkTime.vue';
import MkUrl from '@/components/global/MkUrl.vue';
import I18n from '@/components/global/i18n';
import RouterView from '@/components/global/RouterView.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkError from '@/components/global/MkError.vue';
import MkAd from '@/components/global/MkAd.vue';
import MkPageHeader from '@/components/global/MkPageHeader.vue';
import MkSpacer from '@/components/global/MkSpacer.vue';
import MkStickyContainer from '@/components/global/MkStickyContainer.vue';

declare module '@vue/runtime-core' {
	export interface GlobalComponents {
		I18n: typeof I18n;
		RouterView: typeof RouterView;
		Mfm: typeof Mfm;
		MkA: typeof MkA;
		MkAcct: typeof MkAcct;
		MkAvatar: typeof MkAvatar;
		MkEmoji: typeof MkEmoji;
		MkUserName: typeof MkUserName;
		MkEllipsis: typeof MkEllipsis;
		MkTime: typeof MkTime;
		MkUrl: typeof MkUrl;
		MkLoading: typeof MkLoading;
		MkError: typeof MkError;
		MkAd: typeof MkAd;
		MkPageHeader: typeof MkPageHeader;
		MkSpacer: typeof MkSpacer;
		MkStickyContainer: typeof MkStickyContainer;
	}
}
