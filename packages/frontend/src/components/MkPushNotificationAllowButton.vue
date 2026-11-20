<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkButton
	v-if="supported && !pushRegistrationInServer"
	type="button"
	primary
	:gradate="gradate"
	:rounded="rounded"
	:inline="inline"
	:autofocus="autofocus"
	:wait="wait || processing"
	:full="full"
	@click="subscribe"
>
	{{ i18n.ts.subscribePushNotification }}
</MkButton>
<MkButton
	v-else-if="!showOnlyToRegister && ($i ? pushRegistrationInServer : pushSubscription)"
	type="button"
	:primary="false"
	:gradate="gradate"
	:rounded="rounded"
	:inline="inline"
	:autofocus="autofocus"
	:wait="wait || processing"
	:full="full"
	@click="unsubscribe"
>
	{{ i18n.ts.unsubscribePushNotification }}
</MkButton>
<MkButton v-else-if="$i && pushRegistrationInServer" disabled :rounded="rounded" :inline="inline" :wait="wait" :full="full">
	{{ i18n.ts.pushNotificationAlreadySubscribed }}
</MkButton>
<MkButton v-else-if="!supported" disabled :rounded="rounded" :inline="inline" :wait="wait" :full="full">
	{{ i18n.ts.pushNotificationNotSupported }}
</MkButton>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { instanceName } from '@@/js/config.js';
import { $i } from '@/i.js';
import MkButton from '@/components/MkButton.vue';
import { instance } from '@/instance.js';
import { apiWithDialog, promiseDialog, alert } from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { getAccounts } from '@/accounts.js';
import { encodePushSubscriptionKey } from '@/utility/encode-push-subscription-key.js';

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
	showOnlyToRegister?: boolean;
}>();

// ServiceWorker registration
const registration = ref<ServiceWorkerRegistration | undefined>();
// If this browser supports push notification
const supported = ref(false);
// If this browser has already subscribed to push notification
const pushSubscription = ref<PushSubscription | null>(null);
const pushRegistrationInServer = ref<{ state?: string; key?: string; userId: string; endpoint: string; sendReadMessage: boolean; } | undefined>();
// If a subscribe/unsubscribe operation is currently being processed
const processing = ref(false);

async function subscribe() {
	if (processing.value) return;
	if (!registration.value || !supported.value || !instance.swPublickey) return;

	const swr = registration.value;
	const swPublickey = instance.swPublickey;

	processing.value = true;

	try {
		if ('Notification' in window) {
			let permission = Notification.permission;

			if (Notification.permission === 'default') {
				permission = await promiseDialog(Notification.requestPermission(), null, null, i18n.ts.pleaseAllowPushNotification);
			}

			if (permission !== 'granted') {
				showPermissionDeniedAlert();
				return;
			}
		}

		await promiseDialog((async () => {
			const subscription = await createBrowserSubscription(swr, swPublickey);
			pushSubscription.value = subscription;

			// Register
			pushRegistrationInServer.value = await misskeyApi('sw/register', {
				endpoint: subscription.endpoint,
				auth: encodePushSubscriptionKey(subscription.getKey('auth')),
				publickey: encodePushSubscriptionKey(subscription.getKey('p256dh')),
			});
		})(), null, (err: unknown) => {
			if (err instanceof DOMException && err.name === 'NotAllowedError') {
				showPermissionDeniedAlert();
				return;
			}

			alert({
				type: 'error',
				title: i18n.ts.somethingHappened,
				text: getErrorMessage(err),
			});
		});
	} catch (err) {
		// エラーは promiseDialog のコールバックで表示済み
		console.error(err);
	} finally {
		processing.value = false;
	}
}

async function createBrowserSubscription(swr: ServiceWorkerRegistration, swPublickey: string): Promise<PushSubscription> {
	// SEE: https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe#Parameters
	const options: PushSubscriptionOptionsInit = {
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(swPublickey),
	};

	try {
		return await swr.pushManager.subscribe(options);
	} catch (err) {
		// 違うapplicationServerKey (または gcm_sender_id)のサブスクリプションが
		// 既に存在している場合は InvalidStateError になるので、
		// ブラウザ側のサブスクリプションを解除してから再試行する。
		// それ以外のエラーでは有効な購読を消さないよう、そのまま失敗させる
		if (!(err instanceof DOMException && err.name === 'InvalidStateError')) throw err;

		const existing = await swr.pushManager.getSubscription();
		if (existing == null) throw err;

		// 古い購読に紐づくサーバー側の登録も、可能なら消しておく (失敗しても続行する)
		// 古いキーの購読はどのアカウントでも使えないため、同じブラウザの他アカウント分もまとめて消す。
		// 他アカウントは各自で再度有効化する必要がある
		await misskeyApi('sw/unregister', {
			endpoint: existing.endpoint,
			auth: encodePushSubscriptionKey(existing.getKey('auth')),
			publickey: encodePushSubscriptionKey(existing.getKey('p256dh')),
		}, null).catch(unregisterErr => {
			console.warn('Failed to unregister the stale push subscription from the server.', unregisterErr);
		});

		await existing.unsubscribe();
		pushSubscription.value = null;
		pushRegistrationInServer.value = undefined;

		return await swr.pushManager.subscribe(options);
	}
}

async function unsubscribe() {
	if (processing.value) return;

	const subscription = pushSubscription.value;
	if (!subscription) return;

	const params = {
		endpoint: subscription.endpoint,
		auth: encodePushSubscriptionKey(subscription.getKey('auth')),
		publickey: encodePushSubscriptionKey(subscription.getKey('p256dh')),
	};

	processing.value = true;

	try {
		const accounts = await getAccounts();

		if ($i && accounts.length >= 2) {
			// ブラウザの購読は他アカウントと共有しているので、このアカウントの登録のみ解除する
			await apiWithDialog('sw/unregister', params, $i.token);
			pushRegistrationInServer.value = undefined;
		} else {
			// ブラウザの購読ごと解除するので、この購読に紐づく全アカウントの登録を解除する
			// サーバー側の登録を先に消し、成功してからブラウザの購読を解除する
			await apiWithDialog('sw/unregister', params, null);
			pushRegistrationInServer.value = undefined;

			try {
				await subscription.unsubscribe();
				pushSubscription.value = null;
			} catch (err) {
				console.error(err);
				// サーバー側の登録は解除済みなので、ブラウザの購読が残っていても通知は届かない
				alert({
					type: 'error',
					title: i18n.ts.somethingHappened,
					text: getErrorMessage(err),
				});
			}
		}
	} catch (err) {
		// API エラーは apiWithDialog で表示済み
		console.error(err);
	} finally {
		processing.value = false;
	}
}

function showPermissionDeniedAlert() {
	alert({
		type: 'error',
		title: i18n.ts.browserPushNotificationDisabled,
		text: i18n.tsx.browserPushNotificationDisabledDescription({ serverName: instanceName }),
	});
}

function getErrorMessage(err: unknown): string | undefined {
	if (typeof err === 'object' && err != null && 'message' in err && typeof err.message === 'string') {
		return err.message;
	}
	return undefined;
}

/**
 * Convert the URL safe base64 string to a Uint8Array
 * @param base64String base64 string
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
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

if (navigator.serviceWorker == null) {
	// TODO: よしなに？
} else {
	navigator.serviceWorker.ready.then(async swr => {
		registration.value = swr;

		pushSubscription.value = await registration.value.pushManager.getSubscription();

		if (instance.swPublickey && ('PushManager' in window) && $i && $i.token) {
			supported.value = true;

			if (pushSubscription.value) {
				const res = await misskeyApi('sw/show-registration', {
					endpoint: pushSubscription.value.endpoint,
				});

				if (res) {
					pushRegistrationInServer.value = res;
				}
			}
		}
	});
}

defineExpose({
	pushRegistrationInServer: pushRegistrationInServer,
});
</script>
