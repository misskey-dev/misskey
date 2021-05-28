<template>
<component v-for="popup in popups"
	:key="popup.id"
	:is="popup.component"
	v-bind="popup.props"
	v-on="popup.events"
/>

<XUpload v-if="uploads.length > 0"/>

<XStreamIndicator/>

<div id="wait" v-if="pendingApiRequestsCount > 0"></div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { stream, popup, popups, uploads, pendingApiRequestsCount } from '@client/os';
import * as sound from '@client/scripts/sound';
import { $i } from '@client/account';

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

				popup(import('@client/components/toast.vue'), {
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
