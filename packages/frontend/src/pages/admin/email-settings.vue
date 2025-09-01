<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/email-settings" :label="i18n.ts.emailServer" :keywords="['email']" icon="ti ti-mail">
			<div class="_gaps_m">
				<SearchMarker>
					<MkSwitch v-model="enableEmail">
						<template #label><SearchLabel>{{ i18n.ts.enableEmail }}</SearchLabel> ({{ i18n.ts.recommended }})</template>
						<template #caption><SearchText>{{ i18n.ts.emailConfigInfo }}</SearchText></template>
					</MkSwitch>
				</SearchMarker>

				<template v-if="enableEmail">
					<SearchMarker>
						<MkInput v-model="email" type="email">
							<template #label><SearchLabel>{{ i18n.ts.emailAddress }}</SearchLabel></template>
						</MkInput>
					</SearchMarker>

					<SearchMarker>
						<FormSection>
							<template #label><SearchLabel>{{ i18n.ts.smtpConfig }}</SearchLabel></template>

							<div class="_gaps_m">
								<FormSplit :minWidth="280">
									<SearchMarker>
										<MkInput v-model="smtpHost">
											<template #label><SearchLabel>{{ i18n.ts.smtpHost }}</SearchLabel></template>
										</MkInput>
									</SearchMarker>
									<SearchMarker>
										<MkInput v-model="smtpPort" type="number">
											<template #label><SearchLabel>{{ i18n.ts.smtpPort }}</SearchLabel></template>
										</MkInput>
									</SearchMarker>
								</FormSplit>

								<FormSplit :minWidth="280">
									<SearchMarker>
										<MkInput v-model="smtpUser">
											<template #label><SearchLabel>{{ i18n.ts.smtpUser }}</SearchLabel></template>
										</MkInput>
									</SearchMarker>
									<SearchMarker>
										<MkInput v-model="smtpPass" type="password">
											<template #label><SearchLabel>{{ i18n.ts.smtpPass }}</SearchLabel></template>
										</MkInput>
									</SearchMarker>
								</FormSplit>

								<FormInfo>{{ i18n.ts.emptyToDisableSmtpAuth }}</FormInfo>

								<SearchMarker>
									<MkSwitch v-model="smtpSecure">
										<template #label><SearchLabel>{{ i18n.ts.smtpSecure }}</SearchLabel></template>
										<template #caption><SearchText>{{ i18n.ts.smtpSecureInfo }}</SearchText></template>
									</MkSwitch>
								</SearchMarker>
							</div>
						</FormSection>
					</SearchMarker>
				</template>
			</div>
		</SearchMarker>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<div class="_buttons">
					<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
					<MkButton rounded @click="testEmail"><i class="ti ti-send"></i> {{ i18n.ts.testEmail }}</MkButton>
				</div>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import FormInfo from '@/components/MkInfo.vue';
import FormSplit from '@/components/form/split.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { fetchInstance, instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';

const meta = await misskeyApi('admin/meta');

const enableEmail = ref(meta.enableEmail);
const email = ref(meta.email);
const smtpSecure = ref(meta.smtpSecure);
const smtpHost = ref(meta.smtpHost);
const smtpPort = ref(meta.smtpPort);
const smtpUser = ref(meta.smtpUser);
const smtpPass = ref(meta.smtpPass);

async function testEmail() {
	const { canceled, result: destination } = await os.inputText({
		title: 'To',
		type: 'email',
		default: instance.maintainerEmail ?? '',
		placeholder: 'test@example.com',
		minLength: 1,
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
		enableEmail: enableEmail.value,
		email: email.value,
		smtpSecure: smtpSecure.value,
		smtpHost: smtpHost.value,
		smtpPort: smtpPort.value,
		smtpUser: smtpUser.value,
		smtpPass: smtpPass.value,
	}).then(() => {
		fetchInstance(true);
	});
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.emailServer,
	icon: 'ti ti-mail',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>
