import Vue from 'vue';

Vue.component('mkw-welcome', () => import('./welcome.vue').then(m => m.default));
Vue.component('mkw-memo', () => import('./memo.vue').then(m => m.default));
Vue.component('mkw-notifications', () => import('./notifications.vue').then(m => m.default));
Vue.component('mkw-timeline', () => import('./timeline.vue').then(m => m.default));
Vue.component('mkw-calendar', () => import('./calendar.vue').then(m => m.default));
Vue.component('mkw-rss', () => import('./rss.vue').then(m => m.default));
Vue.component('mkw-trends', () => import('./trends.vue').then(m => m.default));
Vue.component('mkw-clock', () => import('./clock.vue').then(m => m.default));
Vue.component('mkw-activity', () => import('./activity.vue').then(m => m.default));
Vue.component('mkw-photos', () => import('./photos.vue').then(m => m.default));
Vue.component('mkw-digitalClock', () => import('./digital-clock.vue').then(m => m.default));

export const widgets = [
	'memo',
	'notifications',
	'timeline',
	'calendar',
	'rss',
	'trends',
	'clock',
	'activity',
	'photos',
	'digitalClock',
];
