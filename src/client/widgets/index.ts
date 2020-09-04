import { App, defineAsyncComponent } from 'vue';

export default function(app: App) {
	app.component('mkw-welcome', defineAsyncComponent(() => import('./welcome.vue')));
	app.component('mkw-memo', defineAsyncComponent(() => import('./memo.vue')));
	app.component('mkw-notifications', defineAsyncComponent(() => import('./notifications.vue')));
	app.component('mkw-timeline', defineAsyncComponent(() => import('./timeline.vue')));
	app.component('mkw-calendar', defineAsyncComponent(() => import('./calendar.vue')));
	app.component('mkw-rss', defineAsyncComponent(() => import('./rss.vue')));
	app.component('mkw-trends', defineAsyncComponent(() => import('./trends.vue')));
	app.component('mkw-clock', defineAsyncComponent(() => import('./clock.vue')));
	app.component('mkw-activity', defineAsyncComponent(() => import('./activity.vue')));
	app.component('mkw-photos', defineAsyncComponent(() => import('./photos.vue')));
	app.component('mkw-digitalClock', defineAsyncComponent(() => import('./digital-clock.vue')));
	app.component('mkw-federation', defineAsyncComponent(() => import('./federation.vue')));
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
