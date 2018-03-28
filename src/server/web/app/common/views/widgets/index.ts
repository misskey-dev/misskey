import Vue from 'vue';

import wAccessLog from './access-log.vue';
import wVersion from './version.vue';
import wRss from './rss.vue';
import wServer from './server.vue';
import wBroadcast from './broadcast.vue';
import wCalendar from './calendar.vue';
import wPhotoStream from './photo-stream.vue';
import wSlideshow from './slideshow.vue';
import wTips from './tips.vue';
import wDonation from './donation.vue';
import wNav from './nav.vue';

Vue.component('mkw-nav', wNav);
Vue.component('mkw-calendar', wCalendar);
Vue.component('mkw-photo-stream', wPhotoStream);
Vue.component('mkw-slideshow', wSlideshow);
Vue.component('mkw-tips', wTips);
Vue.component('mkw-donation', wDonation);
Vue.component('mkw-broadcast', wBroadcast);
Vue.component('mkw-server', wServer);
Vue.component('mkw-rss', wRss);
Vue.component('mkw-version', wVersion);
Vue.component('mkw-access-log', wAccessLog);
