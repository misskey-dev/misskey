import { App, defineAsyncComponent } from 'vue';

export default function(app: App) {
	app.component('mkw-welcome', defineAsyncComponent(() => import('./welcome.vue').then(m => m.default)));
	app.component('mkw-memo', defineAsyncComponent(() => import('./memo.vue').then(m => m.default)));
	app.component('mkw-notifications', defineAsyncComponent(() => import('./notifications.vue').then(m => m.default)));
	app.component('mkw-timeline', defineAsyncComponent(() => import('./timeline.vue').then(m => m.default)));
	app.component('mkw-calendar', defineAsyncComponent(() => import('./calendar.vue').then(m => m.default)));
	app.component('mkw-rss', defineAsyncComponent(() => import('./rss.vue').then(m => m.default)));
	app.component('mkw-trends', defineAsyncComponent(() => import('./trends.vue').then(m => m.default)));
	app.component('mkw-clock', defineAsyncComponent(() => import('./clock.vue').then(m => m.default)));
	app.component('mkw-activity', defineAsyncComponent(() => import('./activity.vue').then(m => m.default)));
	app.component('mkw-photos', defineAsyncComponent(() => import('./photos.vue').then(m => m.default)));
	app.component('mkw-digitalClock', defineAsyncComponent(() => import('./digital-clock.vue').then(m => m.default)));
	app.component('mkw-federation', defineAsyncComponent(() => import('./federation.vue').then(m => m.default)));
}

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
	'federation',
];
