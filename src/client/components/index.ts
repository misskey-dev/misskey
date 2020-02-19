import Vue from 'vue';

import mfm from './misskey-flavored-markdown.vue';
import acct from './acct.vue';
import avatar from './avatar.vue';
import emoji from './emoji.vue';
import userName from './user-name.vue';
import ellipsis from './ellipsis.vue';
import time from './time.vue';
import url from './url.vue';
import loading from './loading.vue';
import SequentialEntrance from './sequential-entrance.vue';
import error from './error.vue';
import streamIndicator from './stream-indicator.vue';

Vue.component('mfm', mfm);
Vue.component('mk-acct', acct);
Vue.component('mk-avatar', avatar);
Vue.component('mk-emoji', emoji);
Vue.component('mk-user-name', userName);
Vue.component('mk-ellipsis', ellipsis);
Vue.component('mk-time', time);
Vue.component('mk-url', url);
Vue.component('mk-loading', loading);
Vue.component('mk-error', error);
Vue.component('sequential-entrance', SequentialEntrance);
Vue.component('stream-indicator', streamIndicator);
