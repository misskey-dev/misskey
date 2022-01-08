import { App, defineAsyncComponent } from 'vue';

export default function(app: App) {
	app.component('MkwMemo', defineAsyncComponent(() => import('./memo.vue')));
	app.component('MkwNotifications', defineAsyncComponent(() => import('./notifications.vue')));
	app.component('MkwTimeline', defineAsyncComponent(() => import('./timeline.vue')));
	app.component('MkwCalendar', defineAsyncComponent(() => import('./calendar.vue')));
	app.component('MkwRss', defineAsyncComponent(() => import('./rss.vue')));
	app.component('MkwTrends', defineAsyncComponent(() => import('./trends.vue')));
	app.component('MkwClock', defineAsyncComponent(() => import('./clock.vue')));
	app.component('MkwActivity', defineAsyncComponent(() => import('./activity.vue')));
	app.component('MkwPhotos', defineAsyncComponent(() => import('./photos.vue')));
	app.component('MkwDigitalClock', defineAsyncComponent(() => import('./digital-clock.vue')));
	app.component('MkwFederation', defineAsyncComponent(() => import('./federation.vue')));
	app.component('MkwPostForm', defineAsyncComponent(() => import('./post-form.vue')));
	app.component('MkwSlideshow', defineAsyncComponent(() => import('./slideshow.vue')));
	app.component('MkwServerMetric', defineAsyncComponent(() => import('./server-metric/index.vue')));
	app.component('MkwOnlineUsers', defineAsyncComponent(() => import('./online-users.vue')));
	app.component('MkwJobQueue', defineAsyncComponent(() => import('./job-queue.vue')));
	app.component('MkwButton', defineAsyncComponent(() => import('./button.vue')));
	app.component('MkwAiscript', defineAsyncComponent(() => import('./aiscript.vue')));
	app.component('MkwAichan', defineAsyncComponent(() => import('./aichan.vue')));
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
	'postForm',
	'slideshow',
	'serverMetric',
	'onlineUsers',
	'jobQueue',
	'button',
	'aiscript',
	'aichan',
];
