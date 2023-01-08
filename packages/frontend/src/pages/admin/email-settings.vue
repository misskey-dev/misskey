<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
		<FormSuspense :p="init">
			<div class="_gaps_m">
				<MkSwitch v-model="enableEmail">
					<template #label>{{ i18n.ts.enableEmail }} ({{ i18n.ts.recommended }})</template>
					<template #caption>{{ i18n.ts.emailConfigInfo }}</template>
				</MkSwitch>

				<template v-if="enableEmail">
					<MkInput v-model="email" type="email">
						<template #label>{{ i18n.ts.emailAddress }}</template>
					</MkInput>

					<FormSection>
						<template #label>{{ i18n.ts.smtpConfig }}</template>

						<div class="_gaps_m">
							<FormSplit :min-width="280">
								<MkInput v-model="smtpHost">
									<template #label>{{ i18n.ts.smtpHost }}</template>
								</MkInput>
								<MkInput v-model="smtpPort" type="number">
									<template #label>{{ i18n.ts.smtpPort }}</template>
								</MkInput>
							</FormSplit>
							<FormSplit :min-width="280">
								<MkInput v-model="smtpUser">
									<template #label>{{ i18n.ts.smtpUser }}</template>
								</MkInput>
								<MkInput v-model="smtpPass" type="password">
									<template #label>{{ i18n.ts.smtpPass }}</template>
								</MkInput>
							</FormSplit>
							<FormInfo>{{ i18n.ts.emptyToDisableSmtpAuth }}</FormInfo>
							<MkSwitch v-model="smtpSecure">
								<template #label>{{ i18n.ts.smtpSecure }}</template>
								<template #caption>{{ i18n.ts.smtpSecureInfo }}</template>
							</MkSwitch>
						</div>
					</FormSection>
				</template>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XHeader from './_header_.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import FormInfo from '@/components/MkInfo.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSplit from '@/components/form/split.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import { fetchInstance, instance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let enableEmail: boolean = $ref(false);
let email: any = $ref(null);
let smtpSecure: boolean = $ref(false);
let smtpHost: string = $ref('');
let smtpPort: number = $ref(0);
let smtpUser: string = $ref('');
let smtpPass: string = $ref('');

async function init() {
	const meta = await os.api('admin/meta');
	enableEmail = meta.enableEmail;
	email = meta.email;
	smtpSecure = meta.smtpSecure;
	smtpHost = meta.smtpHost;
	smtpPort = meta.smtpPort;
	smtpUser = meta.smtpUser;
	smtpPass = meta.smtpPass;
}

async function testEmail() {
	const { canceled, result: destination } = await os.inputText({
		title: i18n.ts.destination,
		type: 'email',
		placeholder: instance.maintainerEmail,
	});
	if (canceled) return;
	os.apiWithDialog('admin/send-email', {
		to: destination,
		subject: 'Test email',
		text: 'Yo',
	});
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableEmail,
		email,
		smtpSecure,
		smtpHost,
		smtpPort,
		smtpUser,
		smtpPass,
	}).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => [{
	asFullButton: true,
	text: i18n.ts.testEmail,
	handler: testEmail,
}, {
	asFullButton: true,
	icon: 'ti ti-check',
	text: i18n.ts.save,
	handler: save,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.emailServer,
	icon: 'ti ti-mail',
});
</script>
