<!--
SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkFoldableSection>
		<template #header>{{ i18n.ts.notificationSettings }}</template>
		<div class="_gaps_m">
			<MkSwitch v-model="useGroupedNotifications">{{ i18n.ts.useGroupedNotifications }}</MkSwitch>

			<MkRadios v-model="notificationPosition">
				<template #label>{{ i18n.ts.position }}</template>
				<option value="leftTop"><i class="ti ti-align-box-left-top"></i> {{ i18n.ts.leftTop }}</option>
				<option value="rightTop"><i class="ti ti-align-box-right-top"></i> {{ i18n.ts.rightTop }}</option>
				<option value="leftBottom"><i class="ti ti-align-box-left-bottom"></i> {{ i18n.ts.leftBottom }}</option>
				<option value="rightBottom"><i class="ti ti-align-box-right-bottom"></i> {{ i18n.ts.rightBottom }}</option>
			</MkRadios>

			<MkRadios v-model="notificationStackAxis">
				<template #label>{{ i18n.ts.stackAxis }}</template>
				<option value="vertical"><i class="ti ti-carousel-vertical"></i> {{ i18n.ts.vertical }}</option>
				<option value="horizontal"><i class="ti ti-carousel-horizontal"></i> {{ i18n.ts.horizontal }}</option>
			</MkRadios>
		</div>
	</MkFoldableSection>
	<MkFoldableSection>
		<template #header>{{ i18n.ts.notificationRecieveConfig }}</template>
		<FormSection first>
			<div class="_gaps_s">
				<MkFolder v-for="type in notificationTypes.filter(x => !nonConfigurableNotificationTypes.includes(x))" :key="type">
					<template #label>{{ i18n.ts._notification._types[type] }}</template>
					<template #suffix>
						{{
							$i.notificationRecieveConfig[type]?.type === 'never' ? i18n.ts.none :
							$i.notificationRecieveConfig[type]?.type === 'following' ? i18n.ts.following :
							$i.notificationRecieveConfig[type]?.type === 'follower' ? i18n.ts.followers :
							$i.notificationRecieveConfig[type]?.type === 'mutualFollow' ? i18n.ts.mutualFollow :
							$i.notificationRecieveConfig[type]?.type === 'followingOrFollower' ? i18n.ts.followingOrFollower :
							$i.notificationRecieveConfig[type]?.type === 'list' ? i18n.ts.userList :
							i18n.ts.all
						}}
					</template>

					<XNotificationConfig :userLists="userLists" :value="$i.notificationRecieveConfig[type] ?? { type: 'all' }" @update="(res) => updateReceiveConfig(type, res)"/>
				</MkFolder>
			</div>
		</FormSection>
	</MkFoldableSection>
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
	<FormSection>
		<template #label>{{ i18n.ts.otherSettings }}</template>
		<div class="_gaps_m">
			<FormLink @click="readAllNotifications">{{ i18n.ts.markAsReadAllNotifications }}</FormLink>
			<FormLink @click="readAllUnreadNotes">{{ i18n.ts.markAsReadAllUnreadNotes }}</FormLink>
			<FormLink @click="testNotification">{{ i18n.ts._notification.sendTestNotification }}</FormLink>
			<FormLink @click="flushNotification">{{ i18n.ts._notification.flushNotification }}</FormLink>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { shallowRef, computed } from 'vue';
import XNotificationConfig from './notifications.notification-config.vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os.js';
import { signinRequired } from '@/account.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkPushNotificationAllowButton from '@/components/MkPushNotificationAllowButton.vue';
import { notificationTypes } from '@/const.js';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import { defaultStore } from '@/store.js';
import MkFoldableSection from '@/components/MkFoldableSection.vue';

const $i = signinRequired();

const nonConfigurableNotificationTypes = ['note', 'roleAssigned', 'followRequestAccepted', 'achievementEarned'];

const allowButton = shallowRef<InstanceType<typeof MkPushNotificationAllowButton>>();
const pushRegistrationInServer = computed(() => allowButton.value?.pushRegistrationInServer);
const sendReadMessage = computed(() => pushRegistrationInServer.value?.sendReadMessage || false);
const userLists = await misskeyApi('users/lists/list');

const notificationPosition = computed(defaultStore.makeGetterSetter('notificationPosition'));
const notificationStackAxis = computed(defaultStore.makeGetterSetter('notificationStackAxis'));
const useGroupedNotifications = computed(defaultStore.makeGetterSetter('useGroupedNotifications'));

async function readAllUnreadNotes() {
	await misskeyApi('i/read-all-unread-notes');
}

async function readAllNotifications() {
	await misskeyApi('notifications/mark-all-as-read');
}

async function updateReceiveConfig(type, value) {
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

	os.apiWithDialog('notifications/flush');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.notifications,
	icon: 'ti ti-bell',
}));
</script>
