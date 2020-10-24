import { App } from 'vue';

import mfm from './misskey-flavored-markdown.vue';
import a from './ui/a.vue';
import acct from './acct.vue';
import avatar from './avatar.vue';
import emoji from './emoji.vue';
import userName from './user-name.vue';
import ellipsis from './ellipsis.vue';
import time from './time.vue';
import url from './url.vue';
import loading from './loading.vue';
import error from './error.vue';
import streamIndicator from './stream-indicator.vue';

export default function(app: App) {
	app.component('Mfm', mfm);
	app.component('MkA', a);
	app.component('MkAcct', acct);
	app.component('MkAvatar', avatar);
	app.component('MkEmoji', emoji);
	app.component('MkUserName', userName);
	app.component('MkEllipsis', ellipsis);
	app.component('MkTime', time);
	app.component('MkUrl', url);
	app.component('MkLoading', loading);
	app.component('MkError', error);
	app.component('StreamIndicator', streamIndicator);
}
