import { App } from 'vue';

import Mfm from './global/misskey-flavored-markdown.vue';
import MkA from './global/a.vue';
import MkAcct from './global/acct.vue';
import MkAvatar from './global/avatar.vue';
import MkEmoji from './global/emoji.vue';
import MkUserName from './global/user-name.vue';
import MkEllipsis from './global/ellipsis.vue';
import MkTime from './global/time.vue';
import MkUrl from './global/url.vue';
import I18n from './global/i18n';
import MkLoading from './global/loading.vue';
import MkError from './global/error.vue';
import MkAd from './global/ad.vue';
import MkHeader from './global/header.vue';
import MkSpacer from './global/spacer.vue';
import MkStickyContainer from './global/sticky-container.vue';

export default function(app: App) {
	app.component('I18n', I18n);
	app.component('Mfm', Mfm);
	app.component('MkA', MkA);
	app.component('MkAcct', MkAcct);
	app.component('MkAvatar', MkAvatar);
	app.component('MkEmoji', MkEmoji);
	app.component('MkUserName', MkUserName);
	app.component('MkEllipsis', MkEllipsis);
	app.component('MkTime', MkTime);
	app.component('MkUrl', MkUrl);
	app.component('MkLoading', MkLoading);
	app.component('MkError', MkError);
	app.component('MkAd', MkAd);
	app.component('MkHeader', MkHeader);
	app.component('MkSpacer', MkSpacer);
	app.component('MkStickyContainer', MkStickyContainer);
}

declare module '@vue/runtime-core' {
	export interface GlobalComponents {
		I18n: typeof I18n;
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
		MkHeader: typeof MkHeader;
		MkSpacer: typeof MkSpacer;
		MkStickyContainer: typeof MkStickyContainer;
	}
}
