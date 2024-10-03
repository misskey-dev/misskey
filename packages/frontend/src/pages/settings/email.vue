<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="instance.enableEmail" class="_gaps_m">
	<FormSection first>
		<template #label>{{ i18n.ts.emailAddress }}</template>
		<MkInput v-model="emailAddress" type="email" manualSave>
			<template #prefix><i class="ti ti-mail"></i></template>
			<template v-if="$i.email && !$i.emailVerified" #caption>{{ i18n.ts.verificationEmailSent }}</template>
			<template v-else-if="emailAddress === $i.email && $i.emailVerified" #caption><i class="ti ti-check" style="color: var(--success);"></i> {{ i18n.ts.emailVerified }}</template>
		</MkInput>
	</FormSection>

	<FormSection>
		<MkSwitch :modelValue="$i.receiveAnnouncementEmail" @update:modelValue="onChangeReceiveAnnouncementEmail">
			{{ i18n.ts.receiveAnnouncementFromInstance }}
		</MkSwitch>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.emailNotification }}</template>

		<div class="_gaps_s">
			<MkSwitch v-model="emailNotification_mention">
				{{ i18n.ts._notification._types.mention }}
			</MkSwitch>
			<MkSwitch v-model="emailNotification_reply">
				{{ i18n.ts._notification._types.reply }}
			</MkSwitch>
			<MkSwitch v-model="emailNotification_quote">
				{{ i18n.ts._notification._types.quote }}
			</MkSwitch>
			<MkSwitch v-model="emailNotification_follow">
				{{ i18n.ts._notification._types.follow }}
			</MkSwitch>
			<MkSwitch v-model="emailNotification_receiveFollowRequest">
				{{ i18n.ts._notification._types.receiveFollowRequest }}
			</MkSwitch>
		</div>
	</FormSection>
</div>
<div v-if="!instance.enableEmail" class="_gaps_m">
	<MkInfo>{{ i18n.ts.emailNotSupported }}</MkInfo>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, computed } from 'vue';
import FormSection from '@/components/form/section.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { signinRequired } from '@/account.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { instance } from '@/instance.js';

const $i = signinRequired();

const emailAddress = ref($i.email);

const onChangeReceiveAnnouncementEmail = (v) => {
	misskeyApi('i/update', {
		receiveAnnouncementEmail: v,
	});
};

async function saveEmailAddress() {
	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	os.apiWithDialog('i/update-email', {
		password: auth.result.password,
		token: auth.result.token,
		email: emailAddress.value,
	});
}

const emailNotification_mention = ref($i.emailNotificationTypes.includes('mention'));
const emailNotification_reply = ref($i.emailNotificationTypes.includes('reply'));
const emailNotification_quote = ref($i.emailNotificationTypes.includes('quote'));
const emailNotification_follow = ref($i.emailNotificationTypes.includes('follow'));
const emailNotification_receiveFollowRequest = ref($i.emailNotificationTypes.includes('receiveFollowRequest'));

const saveNotificationSettings = () => {
	misskeyApi('i/update', {
		emailNotificationTypes: [
			...[emailNotification_mention.value ? 'mention' : null],
			...[emailNotification_reply.value ? 'reply' : null],
			...[emailNotification_quote.value ? 'quote' : null],
			...[emailNotification_follow.value ? 'follow' : null],
			...[emailNotification_receiveFollowRequest.value ? 'receiveFollowRequest' : null],
		].filter(x => x != null),
	});
};

watch([emailNotification_mention, emailNotification_reply, emailNotification_quote, emailNotification_follow, emailNotification_receiveFollowRequest], () => {
	saveNotificationSettings();
});

onMounted(() => {
	watch(emailAddress, () => {
		saveEmailAddress();
	});
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.email,
	icon: 'ti ti-mail',
}));
</script>
