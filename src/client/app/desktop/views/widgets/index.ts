import Vue from 'vue';

import wNotifications from './notifications.vue';
import wTimemachine from './timemachine.vue';
import wActivity from './activity.vue';
import wTrends from './trends.vue';
import wUsers from './users.vue';
import wPolls from './polls.vue';
import wPostForm from './post-form.vue';
import wMessaging from './messaging.vue';
import wChannel from './channel.vue';
import wProfile from './profile.vue';

Vue.component('mkw-notifications', wNotifications);
Vue.component('mkw-timemachine', wTimemachine);
Vue.component('mkw-activity', wActivity);
Vue.component('mkw-trends', wTrends);
Vue.component('mkw-users', wUsers);
Vue.component('mkw-polls', wPolls);
Vue.component('mkw-post-form', wPostForm);
Vue.component('mkw-messaging', wMessaging);
Vue.component('mkw-channel', wChannel);
Vue.component('mkw-profile', wProfile);
