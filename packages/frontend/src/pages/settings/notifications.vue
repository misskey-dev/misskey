<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/notifications" :label="i18n.ts.notifications" :keywords="['notifications']" icon="ti ti-bell">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/bell_3d.png" color="#ffff00">
			<SearchText>{{ i18n.ts._settings.notificationsBanner }}</SearchText>
		</MkFeatureBanner>

		<FormSection first>
			<template #label>{{ i18n.ts.notificationRecieveConfig }}</template>
			<div class="_gaps_s">
				<MkFolder v-for="type in configurableNotificationTypes" :key="type">
					<template #label>{{ i18n.ts._notification._types[type] }}</template>
					<template #suffix>
						{{
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'never' ? i18n.ts.none :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'following' ? i18n.ts.following :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'follower' ? i18n.ts.followers :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'mutualFollow' ? i18n.ts.mutualFollow :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'followingOrFollower' ? i18n.ts.followingOrFollower :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'list' ? i18n.ts.userList :
							i18n.ts.all
						}}
					</template>

					<XNotificationConfig
						:userLists="userLists"
						:value="$i.notificationRecieveConfig[type] ?? { type: 'all' }"
						:configurableTypes="(onlyOnOrOffNotificationTypes as string[]).includes(type) ? ['all', 'never'] : undefined"
						@update="(res) => updateReceiveConfig(type, res)"
					/>
				</MkFolder>
			</div>
		</FormSection>
		<FormSection>
			<div class="_gaps_m">
				<FormLink to="/settings/sounds">{{ i18n.ts.notificationSoundSettings }}</FormLink>
			</div>
		</FormSection>
		<FormSection>
			<div class="_gaps_s">
				<MkButton @click="readAllNotifications">{{ i18n.ts.markAsReadAllNotifications }}</MkButton>
				<MkButton @click="testNotification">{{ i18n.ts._notification.sendTestNotification }}</MkButton>
				<MkButton @click="flushNotification">{{ i18n.ts._notification.flushNotification }}</MkButton>
			</div>
		</FormSection>
		<FormSection>
			<template #label>{{ i18n.ts.pushNotification }}</template>

			<div class="_gaps_m">
				<MkPushNotificationAllowButton ref="allowButton"/>
				<MkSwitch :disabled="!pushRegistrationInServer" :modelValue="sendReadMessage" @update:modelValue="onChangeSendReadMessage">
					<template #label>{{ i18n.ts.sendPushNotificationReadMessage }}</template>
					<template #caption>{{ i18n.ts.sendPushNotificationReadMessageCaption }}</template>
				</MkSwitch>
			</div>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { useTemplateRef, computed } from 'vue';
import { notificationTypes } from 'misskey-js';
import XNotificationConfig from './notifications.notification-config.vue';
import type { NotificationConfig } from './notifications.notification-config.vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { ensureSignin } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkPushNotificationAllowButton from '@/components/MkPushNotificationAllowButton.vue';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';

const $i = ensureSignin();

const nonConfigurableNotificationTypes = ['note', 'roleAssigned', 'followRequestAccepted', 'test', 'exportCompleted'] as const satisfies (typeof notificationTypes[number])[];

const configurableNotificationTypes = notificationTypes.filter(type => !nonConfigurableNotificationTypes.includes(type as any)) as Exclude<typeof notificationTypes[number], typeof nonConfigurableNotificationTypes[number]>[];

const onlyOnOrOffNotificationTypes = ['app', 'achievementEarned', 'login', 'createToken', 'scheduledNotePosted', 'scheduledNotePostFailed'] as const satisfies (typeof notificationTypes[number])[];

const allowButton = useTemplateRef('allowButton');
const pushRegistrationInServer = computed(() => allowButton.value?.pushRegistrationInServer);
const sendReadMessage = computed(() => pushRegistrationInServer.value?.sendReadMessage || false);
const userLists = await misskeyApi('users/lists/list');

async function readAllNotifications() {
	await os.apiWithDialog('notifications/mark-all-as-read', {});
}

async function updateReceiveConfig(type: typeof notificationTypes[number], value: NotificationConfig) {
	await os.apiWithDialog('i/update', {
		notificationRecieveConfig: {
			...$i.notificationRecieveConfig,
			[type]: value,
		},
	}).then(i => {
		$i.notificationRecieveConfig = i.notificationRecieveConfig;
	});
}

function onChangeSendReadMessage(v: boolean) {
	if (!pushRegistrationInServer.value) return;

	os.apiWithDialog('sw/update-registration', {
		endpoint: pushRegistrationInServer.value.endpoint,
		sendReadMessage: v,
	}).then(res => {
		if (!allowButton.value)	return;
		allowButton.value.pushRegistrationInServer = res;
	});
}

function testNotification(): void {
	misskeyApi('notifications/test-notification');
}

async function flushNotification() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.resetAreYouSure,
	});

	if (canceled) return;

	os.apiWithDialog('notifications/flush', {});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.notifications,
	icon: 'ti ti-bell',
}));
</script>
