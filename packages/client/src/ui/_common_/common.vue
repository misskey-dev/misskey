<template>
<component :is="popup.component"
	v-for="popup in popups"
	:key="popup.id"
	v-bind="popup.props"
	v-on="popup.events"
/>

<XUpload v-if="uploads.length > 0"/>

<XStreamIndicator/>

<div v-if="pendingApiRequestsCount > 0" id="wait"></div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, inject } from 'vue';
import { stream, popup, popups, uploads, pendingApiRequestsCount, pageWindow, post } from '@/os';
import * as sound from '@/scripts/sound';
import { $i, login } from '@/account';
import { SwMessage } from '@/sw/types';
import { popout } from '@/scripts/popout';
import { defaultStore, ColdDeviceStorage } from '@/store';
import { getAccountFromId } from '@/scripts/get-account-from-id';
import { router } from '@/router';

export default defineComponent({
	components: {
		XStreamIndicator: defineAsyncComponent(() => import('./stream-indicator.vue')),
		XUpload: defineAsyncComponent(() => import('./upload.vue')),
	},

	setup() {
		const onNotification = notification => {
			if ($i.mutingNotificationTypes.includes(notification.type)) return;

			if (document.visibilityState === 'visible') {
				stream.send('readNotification', {
					id: notification.id
				});

				popup(import('@/components/toast.vue'), {
					notification
				}, {}, 'closed');
			}

			sound.play('notification');
		};

		if ($i) {
			const connection = stream.useChannel('main', null, 'UI');
			connection.on('notification', onNotification);

			//#region Listen message from SW
			if ('serviceWorker' in navigator) {
				const navHook = inject('navHook', null);
				const sideViewHook = inject('sideViewHook', null);

				navigator.serviceWorker.addEventListener('message', ev => {
					if (_DEV_) {
						console.log('sw msg', ev.data);
					}

					const data = ev.data as SwMessage;
					if (data.type !== 'order') return;

					if (data.loginId !== $i?.id) {
						return getAccountFromId(data.loginId).then(account => {
							if (!account) return;
							return login(account.token, data.url);
						});
					}

					switch (data.order) {
						case 'post':
							return post(data.options);
						case 'push':
							if (router.currentRoute.value.path === data.url) {
								return window.scroll({ top: 0, behavior: 'smooth' });
							}
							if (navHook) {
								return navHook(data.url);
							}
							if (sideViewHook && defaultStore.state.defaultSideView && data.url !== '/') {
								return sideViewHook(data.url);
							}
							return router.push(data.url);
						default:
							return;
					}
				});
			}
		}

		return {
			uploads,
			popups,
			pendingApiRequestsCount,
		};
	}
});
</script>

<style lang="scss">
#wait {
	display: block;
	position: fixed;
	z-index: 10000;
	top: 15px;
	right: 15px;

	&:before {
		content: "";
		display: block;
		width: 18px;
		height: 18px;
		box-sizing: border-box;
		border: solid 2px transparent;
		border-top-color: var(--accent);
		border-left-color: var(--accent);
		border-radius: 50%;
		animation: progress-spinner 400ms linear infinite;
	}
}

@keyframes progress-spinner {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
