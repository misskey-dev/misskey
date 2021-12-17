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
import { defineAsyncComponent, defineComponent } from 'vue';
import { stream, popup, popups, uploads, pendingApiRequestsCount } from '@/os';
import * as sound from '@/scripts/sound';
import { $i } from '@/account';

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
		}

		return {
			uploads,
			popups,
			pendingApiRequestsCount,
		};
	},
});
</script>

<style lang="scss">
#wait {
	display: block;
	position: fixed;
	z-index: 3000000;
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
