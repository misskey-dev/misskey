import Vue from 'vue';

import ui from './ui.vue';
import home from './home.vue';
import timeline from './timeline.vue';
import timelinePost from './timeline-post.vue';
import timelinePostSub from './timeline-post-sub.vue';
import subPostContent from './sub-post-content.vue';
import window from './window.vue';
import postFormWindow from './post-form-window.vue';
import repostFormWindow from './repost-form-window.vue';

Vue.component('mk-ui', ui);
Vue.component('mk-home', home);
Vue.component('mk-timeline', timeline);
Vue.component('mk-timeline-post', timelinePost);
Vue.component('mk-timeline-post-sub', timelinePostSub);
Vue.component('mk-sub-post-content', subPostContent);
Vue.component('mk-window', window);
Vue.component('post-form-window', postFormWindow);
Vue.component('repost-form-window', repostFormWindow);
