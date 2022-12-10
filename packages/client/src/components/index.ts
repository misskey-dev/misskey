/*
  If you edit this file, you should also edit @types/vue.d.ts.
*/
/*
	Global components should be dynamic imported to "conciliate" vite v4.
  https://github.com/misskey-dev/misskey/issues/9302, https://github.com/misskey-dev/misskey/pull/9303
*/

import { App, defineAsyncComponent } from 'vue';

export default function(app: App) {
	app.component('I18n', defineAsyncComponent(() => import('./global/i18n')));
	app.component('RouterView', defineAsyncComponent(() => import('./global/RouterView.vue')));
	app.component('Mfm', defineAsyncComponent(() => import('./global/MkMisskeyFlavoredMarkdown.vue')));
	app.component('MkA', defineAsyncComponent(() => import('./global/MkA.vue')));
	app.component('MkAcct', defineAsyncComponent(() => import('./global/MkAcct.vue')));
	app.component('MkAvatar', defineAsyncComponent(() => import('./global/MkAvatar.vue')));
	app.component('MkEmoji', defineAsyncComponent(() => import('./global/MkEmoji.vue')));
	app.component('MkUserName', defineAsyncComponent(() => import('./global/MkUserName.vue')));
	app.component('MkEllipsis', defineAsyncComponent(() => import('./global/MkEllipsis.vue')));
	app.component('MkTime', defineAsyncComponent(() => import('./global/MkTime.vue')));
	app.component('MkUrl', defineAsyncComponent(() => import('./global/MkUrl.vue')));
	app.component('MkLoading', defineAsyncComponent(() => import('./global/MkLoading.vue')));
	app.component('MkError', defineAsyncComponent(() => import('./global/MkError.vue')));
	app.component('MkAd', defineAsyncComponent(() => import('./global/MkAd.vue')));
	app.component('MkPageHeader', defineAsyncComponent(() => import('./global/MkPageHeader.vue')));
	app.component('MkSpacer', defineAsyncComponent(() => import('./global/MkSpacer.vue')));
	app.component('MkStickyContainer', defineAsyncComponent(() => import('./global/MkStickyContainer.vue')));
}
