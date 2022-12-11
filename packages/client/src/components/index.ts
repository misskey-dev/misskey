/*
  If you edit this file, you should also edit @types/vue.d.ts.
*/

import { App } from 'vue';

import Mfm from './global/MkMisskeyFlavoredMarkdown.vue';
import MkA from './global/MkA.vue';
import MkAcct from './global/MkAcct.vue';
import MkAvatar from './global/MkAvatar.vue';
import MkEmoji from './global/MkEmoji.vue';
import MkUserName from './global/MkUserName.vue';
import MkEllipsis from './global/MkEllipsis.vue';
import MkTime from './global/MkTime.vue';
import MkUrl from './global/MkUrl.vue';
import I18n from './global/i18n';
import RouterView from './global/RouterView.vue';
import MkLoading from './global/MkLoading.vue';
import MkError from './global/MkError.vue';
import MkAd from './global/MkAd.vue';
import MkPageHeader from './global/MkPageHeader.vue';
import MkSpacer from './global/MkSpacer.vue';
import MkStickyContainer from './global/MkStickyContainer.vue';

export default function(app: App) {
	app.component('I18n', I18n);
	app.component('RouterView', RouterView);
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
	app.component('MkPageHeader', MkPageHeader);
	app.component('MkSpacer', MkSpacer);
	app.component('MkStickyContainer', MkStickyContainer);
}
