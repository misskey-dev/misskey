<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
		<FormSuspense :p="init">
			<div class="_gaps_m">
				<MkFolder>
					<template #icon><i class="ti ti-shield"></i></template>
					<template #label>{{ i18n.ts.botProtection }}</template>
					<template v-if="enableHcaptcha" #suffix>hCaptcha</template>
					<template v-else-if="enableMcaptcha" #suffix>mCaptcha</template>
					<template v-else-if="enableRecaptcha" #suffix>reCAPTCHA</template>
					<template v-else-if="enableTurnstile" #suffix>Turnstile</template>
					<template v-else #suffix>{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</template>

					<XBotProtection/>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-eye-off"></i></template>
					<template #label>{{ i18n.ts.sensitiveMediaDetection }}</template>
					<template v-if="sensitiveMediaDetection === 'all'" #suffix>{{ i18n.ts.all }}</template>
					<template v-else-if="sensitiveMediaDetection === 'local'" #suffix>{{ i18n.ts.localOnly }}</template>
					<template v-else-if="sensitiveMediaDetection === 'remote'" #suffix>{{ i18n.ts.remoteOnly }}</template>
					<template v-else #suffix>{{ i18n.ts.none }}</template>

					<div class="_gaps_m">
						<span>{{ i18n.ts._sensitiveMediaDetection.description }}</span>

						<MkRadios v-model="sensitiveMediaDetection">
							<option value="none">{{ i18n.ts.none }}</option>
							<option value="all">{{ i18n.ts.all }}</option>
							<option value="local">{{ i18n.ts.localOnly }}</option>
							<option value="remote">{{ i18n.ts.remoteOnly }}</option>
						</MkRadios>

						<MkRange v-model="sensitiveMediaDetectionSensitivity" :min="0" :max="4" :step="1" :textConverter="(v) => `${v + 1}`">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.sensitivity }}</template>
							<template #caption>{{ i18n.ts._sensitiveMediaDetection.sensitivityDescription }}</template>
						</MkRange>

						<MkSwitch v-model="enableSensitiveMediaDetectionForVideos">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.analyzeVideos }}<span class="_beta">{{ i18n.ts.beta }}</span></template>
							<template #caption>{{ i18n.ts._sensitiveMediaDetection.analyzeVideosDescription }}</template>
						</MkSwitch>

						<MkSwitch v-model="setSensitiveFlagAutomatically">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.setSensitiveFlagAutomatically }} ({{ i18n.ts.notRecommended }})</template>
							<template #caption>{{ i18n.ts._sensitiveMediaDetection.setSensitiveFlagAutomaticallyDescription }}</template>
						</MkSwitch>

						<!-- 現状 false positive が多すぎて実用に耐えない
						<MkSwitch v-model="disallowUploadWhenPredictedAsPorn">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.disallowUploadWhenPredictedAsPorn }}</template>
						</MkSwitch>
						-->

						<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
					</div>
				</MkFolder>

				<MkFolder>
					<template #label>Active Email Validation</template>
					<template v-if="enableActiveEmailValidation" #suffix>Enabled</template>
					<template v-else #suffix>Disabled</template>

					<div class="_gaps_m">
						<span>{{ i18n.ts.activeEmailValidationDescription }}</span>
						<MkSwitch v-model="enableActiveEmailValidation">
							<template #label>Enable</template>
						</MkSwitch>
						<MkSwitch v-model="enableVerifymailApi">
							<template #label>Use Verifymail.io API</template>
						</MkSwitch>
						<MkInput v-model="verifymailAuthKey">
							<template #prefix><i class="ti ti-key"></i></template>
							<template #label>Verifymail.io API Auth Key</template>
						</MkInput>
						<MkSwitch v-model="enableTruemailApi">
							<template #label>Use TrueMail API</template>
						</MkSwitch>
						<MkInput v-model="truemailInstance">
							<template #prefix><i class="ti ti-key"></i></template>
							<template #label>TrueMail API Instance</template>
						</MkInput>
						<MkInput v-model="truemailAuthKey">
							<template #prefix><i class="ti ti-key"></i></template>
							<template #label>TrueMail API Auth Key</template>
						</MkInput>
						<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
					</div>
				</MkFolder>

				<MkFolder>
					<template #label>Banned Email Domains</template>

					<div class="_gaps_m">
						<MkTextarea v-model="bannedEmailDomains">
							<template #label>Banned Email Domains List</template>
						</MkTextarea>
						<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
					</div>
				</MkFolder>

				<MkFolder>
					<template #label>Log IP address</template>
					<template v-if="enableIpLogging" #suffix>Enabled</template>
					<template v-else #suffix>Disabled</template>

					<div class="_gaps_m">
						<MkSwitch v-model="enableIpLogging" @update:modelValue="save">
							<template #label>Enable</template>
						</MkSwitch>
					</div>
				</MkFolder>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XBotProtection from './bot-protection.vue';
import XHeader from './_header_.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSuspense from '@/components/form/suspense.vue';
import MkRange from '@/components/MkRange.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const enableHcaptcha = ref<boolean>(false);
const enableMcaptcha = ref<boolean>(false);
const enableRecaptcha = ref<boolean>(false);
const enableTurnstile = ref<boolean>(false);
const sensitiveMediaDetection = ref<string>('none');
const sensitiveMediaDetectionSensitivity = ref<number>(0);
const setSensitiveFlagAutomatically = ref<boolean>(false);
const enableSensitiveMediaDetectionForVideos = ref<boolean>(false);
const enableIpLogging = ref<boolean>(false);
const enableActiveEmailValidation = ref<boolean>(false);
const enableVerifymailApi = ref<boolean>(false);
const verifymailAuthKey = ref<string | null>(null);
const enableTruemailApi = ref<boolean>(false);
const truemailInstance = ref<string | null>(null);
const truemailAuthKey = ref<string | null>(null);
const bannedEmailDomains = ref<string>('');

async function init() {
	const meta = await misskeyApi('admin/meta');
	enableHcaptcha.value = meta.enableHcaptcha;
	enableMcaptcha.value = meta.enableMcaptcha;
	enableRecaptcha.value = meta.enableRecaptcha;
	enableTurnstile.value = meta.enableTurnstile;
	sensitiveMediaDetection.value = meta.sensitiveMediaDetection;
	sensitiveMediaDetectionSensitivity.value =
		meta.sensitiveMediaDetectionSensitivity === 'veryLow' ? 0 :
		meta.sensitiveMediaDetectionSensitivity === 'low' ? 1 :
		meta.sensitiveMediaDetectionSensitivity === 'medium' ? 2 :
		meta.sensitiveMediaDetectionSensitivity === 'high' ? 3 :
		meta.sensitiveMediaDetectionSensitivity === 'veryHigh' ? 4 : 0;
	setSensitiveFlagAutomatically.value = meta.setSensitiveFlagAutomatically;
	enableSensitiveMediaDetectionForVideos.value = meta.enableSensitiveMediaDetectionForVideos;
	enableIpLogging.value = meta.enableIpLogging;
	enableActiveEmailValidation.value = meta.enableActiveEmailValidation;
	enableVerifymailApi.value = meta.enableVerifymailApi;
	verifymailAuthKey.value = meta.verifymailAuthKey;
	enableTruemailApi.value = meta.enableTruemailApi;
	truemailInstance.value = meta.truemailInstance;
	truemailAuthKey.value = meta.truemailAuthKey;
	bannedEmailDomains.value = meta.bannedEmailDomains?.join('\n') || '';
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		sensitiveMediaDetection: sensitiveMediaDetection.value,
		sensitiveMediaDetectionSensitivity:
			sensitiveMediaDetectionSensitivity.value === 0 ? 'veryLow' :
			sensitiveMediaDetectionSensitivity.value === 1 ? 'low' :
			sensitiveMediaDetectionSensitivity.value === 2 ? 'medium' :
			sensitiveMediaDetectionSensitivity.value === 3 ? 'high' :
			sensitiveMediaDetectionSensitivity.value === 4 ? 'veryHigh' :
			0,
		setSensitiveFlagAutomatically: setSensitiveFlagAutomatically.value,
		enableSensitiveMediaDetectionForVideos: enableSensitiveMediaDetectionForVideos.value,
		enableIpLogging: enableIpLogging.value,
		enableActiveEmailValidation: enableActiveEmailValidation.value,
		enableVerifymailApi: enableVerifymailApi.value,
		verifymailAuthKey: verifymailAuthKey.value,
		enableTruemailApi: enableTruemailApi.value,
		truemailInstance: truemailInstance.value,
		truemailAuthKey: truemailAuthKey.value,
		bannedEmailDomains: bannedEmailDomains.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.security,
	icon: 'ti ti-lock',
}));
</script>
