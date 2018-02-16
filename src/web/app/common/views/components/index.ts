import Vue from 'vue';

import signin from './signin.vue';
import signup from './signup.vue';
import forkit from './forkit.vue';
import nav from './nav.vue';
import postHtml from './post-html';
import reactionIcon from './reaction-icon.vue';
import reactionsViewer from './reactions-viewer.vue';
import time from './time.vue';
import images from './images.vue';
import uploader from './uploader.vue';
import specialMessage from './special-message.vue';
import streamIndicator from './stream-indicator.vue';

Vue.component('mk-signin', signin);
Vue.component('mk-signup', signup);
Vue.component('mk-forkit', forkit);
Vue.component('mk-nav', nav);
Vue.component('mk-post-html', postHtml);
Vue.component('mk-reaction-icon', reactionIcon);
Vue.component('mk-reactions-viewer', reactionsViewer);
Vue.component('mk-time', time);
Vue.component('mk-images', images);
Vue.component('mk-uploader', uploader);
Vue.component('mk-special-message', specialMessage);
Vue.component('mk-stream-indicator', streamIndicator);
