<template>
<MkButton
	v-if="supported && !pushSubscription"
	type="button"
	primary
	:gradate="gradate"
	:rounded="rounded"
	:inline="inline"
	:autofocus="autofocus"
	:wait="wait"
	:full="full"
	@click="subscribe"
>
	{{ i18n.ts.subscribePushNotification }}
</MkButton>
<MkButton
	v-else-if="supported || pushSubscription"
	type="button"
	:primary="false"
	:gradate="gradate"
	:rounded="rounded"
	:inline="inline"
	:autofocus="autofocus"
	:wait="wait"
	:full="full"
	@click="unsubscribe"
>
	{{ i18n.ts.unsubscribePushNotification }}
</MkButton>
</template>

<script setup lang="ts">
import { $i } from '@/account';
import MkButton from '@/components/MkButton.vue';
import { instance } from '@/instance';
import { api } from '@/os';
import { i18n } from '@/i18n';

defineProps<{
	primary?: boolean;
	gradate?: boolean;
	rounded?: boolean;
	inline?: boolean;
	link?: boolean;
	to?: string;
	autofocus?: boolean;
	wait?: boolean;
	danger?: boolean;
	full?: boolean;
	showOnlyIfNotRegistered?: boolean;
}>();

let supported = $ref(false);
let pushSubscription = $ref<PushSubscription | null>(null);
let registration = $ref<ServiceWorkerRegistration | undefined>();

navigator.serviceWorker.ready.then(async _registration => {
	registration = _registration;

	if (instance.swPublickey && ('PushManager' in window) && $i && $i.token) {
		supported = true;
	}

	pushSubscription = await registration.pushManager.getSubscription();
});

function subscribe() {
	if (!registration || !supported || !instance.swPublickey) return;

	// SEE: https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe#Parameters
	registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(instance.swPublickey)
	})
	.then(async subscription => {
		function encode(buffer: ArrayBuffer | null) {
			return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
		}

		// Register
		await api('sw/register', {
			endpoint: subscription.endpoint,
			auth: encode(subscription.getKey('auth')),
			publickey: encode(subscription.getKey('p256dh'))
		});

		pushSubscription = subscription;
	})
	// When subscribe failed
	.catch(async (err: Error) => {
		// 通知が許可されていなかったとき
		if (err.name === 'NotAllowedError') {
			return;
		}
		
		// 違うapplicationServerKey (または gcm_sender_id)のサブスクリプションが
		// 既に存在していることが原因でエラーになった可能性があるので、
		// そのサブスクリプションを解除しておく
		// （これは実行されなさそうだけど、おまじない的に古い実装から残してある）
		unsubscribe();
	});
}

async function unsubscribe() {
	if (!registration) return;

	const subscription = await registration.pushManager.getSubscription();

	if (subscription) {
		await subscription.unsubscribe();

		if ($i) {
			await api('sw/unregister', {
				i: $i.token,
				endpoint: subscription.endpoint
			});
		}
	}
}

/**
 * Convert the URL safe base64 string to a Uint8Array
 * @param base64String base64 string
 */
 function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
		.replace(/-/g, '+')
		.replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

</script>
