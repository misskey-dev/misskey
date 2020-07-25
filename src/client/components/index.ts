import { App } from 'vue';

import mfm from './misskey-flavored-markdown.vue';
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
	app.component('mfm', mfm);
	app.component('mk-acct', acct);
	app.component('mk-avatar', avatar);
	app.component('mk-emoji', emoji);
	app.component('mk-user-name', userName);
	app.component('mk-ellipsis', ellipsis);
	app.component('mk-time', time);
	app.component('mk-url', url);
	app.component('mk-loading', loading);
	app.component('mk-error', error);
	app.component('stream-indicator', streamIndicator);
}
