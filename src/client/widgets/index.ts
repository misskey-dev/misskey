import Vue from 'vue';

Vue.component('mkw-memo', () => import('./memo.vue').then(m => m.default));
Vue.component('mkw-notifications', () => import('./notifications.vue').then(m => m.default));
Vue.component('mkw-timeline', () => import('./timeline.vue').then(m => m.default));
Vue.component('mkw-calendar', () => import('./calendar.vue').then(m => m.default));
Vue.component('mkw-rss', () => import('./rss.vue').then(m => m.default));
Vue.component('mkw-trends', () => import('./trends.vue').then(m => m.default));
Vue.component('mkw-clock', () => import('./clock.vue').then(m => m.default));
