<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection first>
		<template #label>{{ i18n.ts.notificationRecieveConfig }}</template>
		<div class="_gaps_s">
			<MkFolder v-for="type in notificationTypes" :key="type">
				<template #label>{{ i18n.t('_notification._types.' + type) }}</template>
				<template #suffix>
					{{
						$i.notificationRecieveConfig[type]?.type === 'never' ? i18n.ts.none :
						$i.notificationRecieveConfig[type]?.type === 'following' ? i18n.ts.following :
						$i.notificationRecieveConfig[type]?.type === 'follower' ? i18n.ts.followers :
						$i.notificationRecieveConfig[type]?.type === 'mutualFollow' ? i18n.ts.mutualFollow :
						$i.notificationRecieveConfig[type]?.type === 'list' ? i18n.ts.userList :
						i18n.ts.all
					}}
				</template>

				<XNotificationConfig :userLists="userLists" :value="$i.notificationRecieveConfig[type] ?? { type: 'all' }" @update="(res) => updateReceiveConfig(type, res)"/>
			</MkFolder>
		</div>
	</FormSection>
	<FormSection>
		<div class="_gaps_m">
			<FormLink @click="readAllNotifications">{{ i18n.ts.markAsReadAllNotifications }}</FormLink>
			<FormLink @click="readAllUnreadNotes">{{ i18n.ts.markAsReadAllUnreadNotes }}</FormLink>
		</div>
	</FormSection>
	<FormSection>
		<div class="_gaps_m">
			<FormLink @click="testNotification">{{ i18n.ts._notification.sendTestNotification }}</FormLink>
		</div>
	</FormSection>
	<FormSection>
		<template #label>{{ i18n.ts.pushNotification }}</template>

		<div class="_gaps_m">
			<MkPushNotificationAllowButton ref="allowButton"/>
			<MkSwitch :disabled="!pushRegistrationInServer" :modelValue="sendReadMessage" @update:modelValue="onChangeSendReadMessage">
				<template #label>{{ i18n.ts.sendPushNotificationReadMessage }}</template>
				<template #caption>
					<I18n :src="i18n.ts.sendPushNotificationReadMessageCaption">
						<template #emptyPushNotificationMessage>{{ i18n.ts._notification.emptyPushNotificationMessage }}</template>
					</I18n>
				</template>
			</MkSwitch>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import XNotificationConfig from './notifications.notification-config.vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkPushNotificationAllowButton from '@/components/MkPushNotificationAllowButton.vue';
import { notificationTypes } from '@/const.js';

let allowButton = $shallowRef<InstanceType<typeof MkPushNotificationAllowButton>>();
let pushRegistrationInServer = $computed(() => allowButton?.pushRegistrationInServer);
let sendReadMessage = $computed(() => pushRegistrationInServer?.sendReadMessage || false);
const userLists = await os.api('users/lists/list');

async function readAllUnreadNotes() {
	await os.apiWithDialog('i/read-all-unread-notes');
}

async function readAllNotifications() {
	await os.apiWithDialog('notifications/mark-all-as-read');
}

async function updateReceiveConfig(type, value) {
	await os.apiWithDialog('i/update', {
		notificationRecieveConfig: {
			...$i!.notificationRecieveConfig,
			[type]: value,
		},
	}).then(i => {
		$i!.notificationRecieveConfig = i.notificationRecieveConfig;
	});
}

function onChangeSendReadMessage(v: boolean) {
	if (!pushRegistrationInServer) return;

	os.apiWithDialog('sw/update-registration', {
		endpoint: pushRegistrationInServer.endpoint,
		sendReadMessage: v,
	}).then(res => {
		if (!allowButton)	return;
		allowButton.pushRegistrationInServer = res;
	});
}

function testNotification(): void {
	os.api('notifications/test-notification');
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.notifications,
	icon: 'ti ti-bell',
});
</script>
