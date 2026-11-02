<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/email" :label="i18n.ts.email" :keywords="['email']" icon="ti ti-mail">
	<div class="_gaps_m">
		<MkInfo v-if="!instance.enableEmail">{{ i18n.ts.emailNotSupported }}</MkInfo>

		<MkDisableSection :disabled="!instance.enableEmail">
			<div class="_gaps_m">
				<SearchMarker :keywords="['email', 'address']">
					<FormSection first>
						<template #label><SearchLabel>{{ i18n.ts.emailAddress }}</SearchLabel></template>
						<MkInput v-model="emailAddress" type="email" manualSave>
							<template #prefix><i class="ti ti-mail"></i></template>
							<template v-if="$i.email && !$i.emailVerified" #caption>{{ i18n.ts.verificationEmailSent }}</template>
							<template v-else-if="emailAddress === $i.email && $i.emailVerified" #caption><i class="ti ti-check" style="color: var(--MI_THEME-success);"></i> {{ i18n.ts.emailVerified }}</template>
						</MkInput>
					</FormSection>
				</SearchMarker>

				<FormSection>
					<SearchMarker :keywords="['announcement', 'email']">
						<MkSwitch :modelValue="$i.receiveAnnouncementEmail" @update:modelValue="onChangeReceiveAnnouncementEmail">
							<template #label><SearchLabel>{{ i18n.ts.receiveAnnouncementFromInstance }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>
				</FormSection>

				<SearchMarker :keywords="['notification', 'email']">
					<FormSection>
						<template #label><SearchLabel>{{ i18n.ts.emailNotification }}</SearchLabel></template>

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
				</SearchMarker>
			</div>
		</MkDisableSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, computed } from 'vue';
import FormSection from '@/components/form/section.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkDisableSection from '@/components/MkDisableSection.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { ensureSignin } from '@/i.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { instance } from '@/instance.js';

const $i = ensureSignin();

const emailAddress = ref($i.email ?? '');

function onChangeReceiveAnnouncementEmail(v: boolean) {
	misskeyApi('i/update', {
		receiveAnnouncementEmail: v,
	});
}

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

definePage(() => ({
	title: i18n.ts.email,
	icon: 'ti ti-mail',
}));
</script>
