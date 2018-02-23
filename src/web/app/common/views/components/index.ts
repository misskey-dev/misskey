import Vue from 'vue';

import signin from './signin.vue';
import signup from './signup.vue';
import forkit from './forkit.vue';
import nav from './nav.vue';
import postHtml from './post-html';
import poll from './poll.vue';
import pollEditor from './poll-editor.vue';
import reactionIcon from './reaction-icon.vue';
import reactionsViewer from './reactions-viewer.vue';
import time from './time.vue';
import images from './images.vue';
import uploader from './uploader.vue';
import specialMessage from './special-message.vue';
import streamIndicator from './stream-indicator.vue';
import ellipsis from './ellipsis.vue';
import messaging from './messaging.vue';
import messagingRoom from './messaging-room.vue';
import urlPreview from './url-preview.vue';
import twitterSetting from './twitter-setting.vue';
import fileTypeIcon from './file-type-icon.vue';

//#region widgets
import wAccessLog from './widgets/access-log.vue';
import wVersion from './widgets/version.vue';
import wRss from './widgets/rss.vue';
import wProfile from './widgets/profile.vue';
import wServer from './widgets/server.vue';
import wBroadcast from './widgets/broadcast.vue';
import wCalendar from './widgets/calendar.vue';
import wPhotoStream from './widgets/photo-stream.vue';
import wSlideshow from './widgets/slideshow.vue';
import wTips from './widgets/tips.vue';
import wDonation from './widgets/donation.vue';
import wNav from './widgets/nav.vue';
//#endregion

Vue.component('mk-signin', signin);
Vue.component('mk-signup', signup);
Vue.component('mk-forkit', forkit);
Vue.component('mk-nav', nav);
Vue.component('mk-post-html', postHtml);
Vue.component('mk-poll', poll);
Vue.component('mk-poll-editor', pollEditor);
Vue.component('mk-reaction-icon', reactionIcon);
Vue.component('mk-reactions-viewer', reactionsViewer);
Vue.component('mk-time', time);
Vue.component('mk-images', images);
Vue.component('mk-uploader', uploader);
Vue.component('mk-special-message', specialMessage);
Vue.component('mk-stream-indicator', streamIndicator);
Vue.component('mk-ellipsis', ellipsis);
Vue.component('mk-messaging', messaging);
Vue.component('mk-messaging-room', messagingRoom);
Vue.component('mk-url-preview', urlPreview);
Vue.component('mk-twitter-setting', twitterSetting);
Vue.component('mk-file-type-icon', fileTypeIcon);

//#region widgets
Vue.component('mkw-nav', wNav);
Vue.component('mkw-calendar', wCalendar);
Vue.component('mkw-photo-stream', wPhotoStream);
Vue.component('mkw-slideshow', wSlideshow);
Vue.component('mkw-tips', wTips);
Vue.component('mkw-donation', wDonation);
Vue.component('mkw-broadcast', wBroadcast);
Vue.component('mkw-profile', wProfile);
Vue.component('mkw-server', wServer);
Vue.component('mkw-rss', wRss);
Vue.component('mkw-version', wVersion);
Vue.component('mkw-access-log', wAccessLog);
//#endregion
