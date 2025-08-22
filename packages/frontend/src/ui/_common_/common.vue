<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="prefer.s.animation ? $style.transition_menuDrawerBg_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_menuDrawerBg_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_menuDrawerBg_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_menuDrawerBg_leaveTo : ''"
>
	<div
		v-if="drawerMenuShowing"
		:class="$style.menuDrawerBg"
		class="_modalBg"
		@click="drawerMenuShowing = false"
		@touchstart.passive="drawerMenuShowing = false"
	></div>
</Transition>

<Transition
	:enterActiveClass="prefer.s.animation ? $style.transition_menuDrawer_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_menuDrawer_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_menuDrawer_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_menuDrawer_leaveTo : ''"
>
	<div v-if="drawerMenuShowing" :class="$style.menuDrawer">
		<XNavbar style="height: 100%;" :asDrawer="true" :showWidgetButton="false"/>
	</div>
</Transition>

<Transition
	:enterActiveClass="prefer.s.animation ? $style.transition_widgetsDrawerBg_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_widgetsDrawerBg_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_widgetsDrawerBg_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_widgetsDrawerBg_leaveTo : ''"
>
	<div
		v-if="widgetsShowing"
		:class="$style.widgetsDrawerBg"
		class="_modalBg"
		@click="widgetsShowing = false"
		@touchstart.passive="widgetsShowing = false"
	></div>
</Transition>

<Transition
	:enterActiveClass="prefer.s.animation ? $style.transition_widgetsDrawer_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_widgetsDrawer_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_widgetsDrawer_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_widgetsDrawer_leaveTo : ''"
>
	<div v-if="widgetsShowing" :class="$style.widgetsDrawer">
		<button class="_button" :class="$style.widgetsCloseButton" @click="widgetsShowing = false"><i class="ti ti-x"></i></button>
		<XWidgets/>
	</div>
</Transition>

<component
	:is="popup.component"
	v-for="popup in popups"
	:key="popup.id"
	v-bind="popup.props"
	v-on="popup.events"
/>

<component
	:is="prefer.s.animation ? TransitionGroup : 'div'"
	tag="div"
	:class="[$style.notifications, {
		[$style.notificationsPosition_leftTop]: prefer.s.notificationPosition === 'leftTop',
		[$style.notificationsPosition_leftBottom]: prefer.s.notificationPosition === 'leftBottom',
		[$style.notificationsPosition_rightTop]: prefer.s.notificationPosition === 'rightTop',
		[$style.notificationsPosition_rightBottom]: prefer.s.notificationPosition === 'rightBottom',
		[$style.notificationsStackAxis_vertical]: prefer.s.notificationStackAxis === 'vertical',
		[$style.notificationsStackAxis_horizontal]: prefer.s.notificationStackAxis === 'horizontal',
	}]"
	:moveClass="$style.transition_notification_move"
	:enterActiveClass="$style.transition_notification_enterActive"
	:leaveActiveClass="$style.transition_notification_leaveActive"
	:enterFromClass="$style.transition_notification_enterFrom"
	:leaveToClass="$style.transition_notification_leaveTo"
>
	<div v-for="notification in notifications" :key="notification.id" :class="$style.notification">
		<XNotification :notification="notification"/>
	</div>
</component>

<XStreamIndicator/>

<div v-if="pendingApiRequestsCount > 0" id="wait"></div>

<div v-if="dev" id="devTicker"><span style="animation: dev-ticker-blink 2s infinite;">DEV BUILD</span></div>

<div v-if="$i && $i.isBot" id="botWarn"><span style="animation: dev-ticker-blink 2s infinite;">{{ i18n.ts.loggedInAsBot }}</span></div>

<div v-if="isSafeMode" id="safemodeWarn">
	<span style="animation: dev-ticker-blink 2s infinite;">{{ i18n.ts.safeModeEnabled }}</span>&nbsp;
	<button class="_textButton" style="pointer-events: all;" @click="exitSafeMode">{{ i18n.ts.turnItOff }}</button>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref, TransitionGroup } from 'vue';
import * as Misskey from 'misskey-js';
import { swInject } from './sw-inject.js';
import XNotification from './notification.vue';
import { isSafeMode } from '@@/js/config.js';
import { popups } from '@/os.js';
import { unisonReload } from '@/utility/unison-reload.js';
import { miLocalStorage } from '@/local-storage.js';
import { pendingApiRequestsCount } from '@/utility/misskey-api.js';
import * as sound from '@/utility/sound.js';
import { $i } from '@/i.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { globalEvents } from '@/events.js';
import { store } from '@/store.js';
import XNavbar from '@/ui/_common_/navbar.vue';

const XStreamIndicator = defineAsyncComponent(() => import('./stream-indicator.vue'));
const XWidgets = defineAsyncComponent(() => import('./widgets.vue'));

const drawerMenuShowing = defineModel<boolean>('drawerMenuShowing');
const widgetsShowing = defineModel<boolean>('widgetsShowing');

const dev = _DEV_;

const notifications = ref<Misskey.entities.Notification[]>([]);

function onNotification(notification: Misskey.entities.Notification, isClient = false) {
	if (window.document.visibilityState === 'visible') {
		if (!isClient && notification.type !== 'test') {
			// サーバーサイドのテスト通知の際は自動で既読をつけない（テストできないので）
			if (store.s.realtimeMode) {
				useStream().send('readNotification');
			}
		}

		notifications.value.unshift(notification);
		window.setTimeout(() => {
			if (notifications.value.length > 3) notifications.value.pop();
		}, 500);

		window.setTimeout(() => {
			notifications.value = notifications.value.filter(x => x.id !== notification.id);
		}, 6000);
	}

	sound.playMisskeySfx('notification');
}

function exitSafeMode() {
	miLocalStorage.removeItem('isSafeMode');
	const url = new URL(window.location.href);
	url.searchParams.delete('safemode');
	unisonReload(url.toString());
}

if ($i) {
	if (store.s.realtimeMode) {
		const connection = useStream().useChannel('main');
		connection.on('notification', onNotification);
	}
	globalEvents.on('clientNotification', notification => onNotification(notification, true));

	if ('serviceWorker' in navigator) {
		swInject();
	}
}
</script>

<style lang="scss" module>
.transition_menuDrawerBg_enterActive,
.transition_menuDrawerBg_leaveActive {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_menuDrawerBg_enterFrom,
.transition_menuDrawerBg_leaveTo {
	opacity: 0;
}

.transition_menuDrawer_enterActive,
.transition_menuDrawer_leaveActive {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_menuDrawer_enterFrom,
.transition_menuDrawer_leaveTo {
	opacity: 0;
	transform: translateX(-240px);
}

.transition_widgetsDrawerBg_enterActive,
.transition_widgetsDrawerBg_leaveActive {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_widgetsDrawerBg_enterFrom,
.transition_widgetsDrawerBg_leaveTo {
	opacity: 0;
}

.transition_widgetsDrawer_enterActive,
.transition_widgetsDrawer_leaveActive {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_widgetsDrawer_enterFrom,
.transition_widgetsDrawer_leaveTo {
	opacity: 0;
	transform: translateX(-240px);
}

.transition_notification_move,
.transition_notification_enterActive,
.transition_notification_leaveActive {
	transition: opacity 0.3s, transform 0.3s !important;
}
.transition_notification_enterFrom {
	opacity: 0;
	transform: translateX(250px);
}
.transition_notification_leaveTo {
	opacity: 0;
	transform: translateX(-250px);
}

.menuDrawerBg {
	z-index: 1001;
}

.menuDrawer {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 1001;
	height: 100dvh;
}

.widgetsDrawerBg {
	z-index: 1001;
}

.widgetsDrawer {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 1001;
	width: 310px;
	height: 100dvh;
	padding: var(--MI-margin) var(--MI-margin) calc(var(--MI-margin) + env(safe-area-inset-bottom, 0px)) !important;
	box-sizing: border-box;
	overflow: auto;
	overscroll-behavior: contain;
	background: var(--MI_THEME-bg);
}

.widgetsCloseButton {
	padding: 8px;
	display: block;
	margin: 0 auto;
}

@media (min-width: 370px) {
	.widgetsCloseButton {
		display: none;
	}
}

.notifications {
	position: fixed;
	z-index: 3900000;
	padding: 0 var(--MI-margin);
	pointer-events: none;
	display: flex;

	&.notificationsPosition_leftTop {
		top: var(--MI-margin);
		left: 0;
	}

	&.notificationsPosition_rightTop {
		top: var(--MI-margin);
		right: 0;
	}

	&.notificationsPosition_leftBottom {
		bottom: calc(var(--MI-minBottomSpacing) + var(--MI-margin));
		left: 0;
	}

	&.notificationsPosition_rightBottom {
		bottom: calc(var(--MI-minBottomSpacing) + var(--MI-margin));
		right: 0;
	}

	&.notificationsStackAxis_vertical {
		width: 250px;

		&.notificationsPosition_leftTop,
		&.notificationsPosition_rightTop {
			flex-direction: column;

			.notification {
				& + .notification {
					margin-top: 8px;
				}
			}
		}

		&.notificationsPosition_leftBottom,
		&.notificationsPosition_rightBottom {
			flex-direction: column-reverse;

			.notification {
				& + .notification {
					margin-bottom: 8px;
				}
			}
		}
	}

	&.notificationsStackAxis_horizontal {
		width: 100%;

		&.notificationsPosition_leftTop,
		&.notificationsPosition_leftBottom {
			flex-direction: row;

			.notification {
				& + .notification {
					margin-left: 8px;
				}
			}
		}

		&.notificationsPosition_rightTop,
		&.notificationsPosition_rightBottom {
			flex-direction: row-reverse;

			.notification {
				& + .notification {
					margin-right: 8px;
				}
			}
		}

		.notification {
			width: 250px;
			flex-shrink: 0;
		}
	}
}

.notification {
	container-type: inline-size;
}
</style>

<style lang="scss">
@keyframes dev-ticker-blink {
	0% { opacity: 1; }
	50% { opacity: 0; }
	100% { opacity: 1; }
}

@keyframes progress-spinner {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

#wait {
	display: block;
	position: fixed;
	z-index: 4000000;
	top: 15px;
	right: 15px;
	pointer-events: none;

	&::before {
		content: "";
		display: block;
		width: 18px;
		height: 18px;
		box-sizing: border-box;
		border: solid 2px transparent;
		border-top-color: var(--MI_THEME-accent);
		border-left-color: var(--MI_THEME-accent);
		border-radius: 50%;
		animation: progress-spinner 400ms linear infinite;
	}
}

#botWarn {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	margin: auto;
	width: 100%;
	height: max-content;
	text-align: center;
	z-index: 2147483646;
	color: #ff0;
	background: rgba(0, 0, 0, 0.5);
	padding: 4px 7px;
	font-size: 14px;
	pointer-events: none;
	user-select: none;
}

#safemodeWarn {
	@extend #botWarn;
	z-index: 2147483647;
}

#devTicker {
	position: fixed;
	bottom: 0;
	left: 0;
	z-index: 2147483647;
	color: #ff0;
	background: rgba(0, 0, 0, 0.5);
	padding: 4px 5px;
	font-size: 14px;
	pointer-events: none;
	user-select: none;
}
</style>
