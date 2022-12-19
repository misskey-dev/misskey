<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
		<FormSuspense :p="init">
			<div class="_formRoot">
				<FormFolder class="_formBlock">
					<template #icon><i class="fas fa-shield-alt"></i></template>
					<template #label>{{ i18n.ts.botProtection }}</template>
					<template v-if="enableHcaptcha" #suffix>hCaptcha</template>
					<template v-else-if="enableRecaptcha" #suffix>reCAPTCHA</template>
					<template v-else-if="enableTurnstile" #suffix>Turnstile</template>
					<template v-else #suffix>{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</template>

					<XBotProtection/>
				</FormFolder>

				<FormFolder class="_formBlock">
					<template #icon><i class="fas fa-eye-slash"></i></template>
					<template #label>{{ i18n.ts.sensitiveMediaDetection }}</template>
					<template v-if="sensitiveMediaDetection === 'all'" #suffix>{{ i18n.ts.all }}</template>
					<template v-else-if="sensitiveMediaDetection === 'local'" #suffix>{{ i18n.ts.localOnly }}</template>
					<template v-else-if="sensitiveMediaDetection === 'remote'" #suffix>{{ i18n.ts.remoteOnly }}</template>
					<template v-else #suffix>{{ i18n.ts.none }}</template>

					<div class="_formRoot">
						<span class="_formBlock">{{ i18n.ts._sensitiveMediaDetection.description }}</span>

						<FormRadios v-model="sensitiveMediaDetection" class="_formBlock">
							<option value="none">{{ i18n.ts.none }}</option>
							<option value="all">{{ i18n.ts.all }}</option>
							<option value="local">{{ i18n.ts.localOnly }}</option>
							<option value="remote">{{ i18n.ts.remoteOnly }}</option>
						</FormRadios>

						<FormRange v-model="sensitiveMediaDetectionSensitivity" :min="0" :max="4" :step="1" :text-converter="(v) => `${v + 1}`" class="_formBlock">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.sensitivity }}</template>
							<template #caption>{{ i18n.ts._sensitiveMediaDetection.sensitivityDescription }}</template>
						</FormRange>

						<FormSwitch v-model="enableSensitiveMediaDetectionForVideos" class="_formBlock">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.analyzeVideos }}<span class="_beta">{{ i18n.ts.beta }}</span></template>
							<template #caption>{{ i18n.ts._sensitiveMediaDetection.analyzeVideosDescription }}</template>
						</FormSwitch>

						<FormSwitch v-model="setSensitiveFlagAutomatically" class="_formBlock">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.setSensitiveFlagAutomatically }} ({{ i18n.ts.notRecommended }})</template>
							<template #caption>{{ i18n.ts._sensitiveMediaDetection.setSensitiveFlagAutomaticallyDescription }}</template>
						</FormSwitch>

						<!-- 現状 false positive が多すぎて実用に耐えない
						<FormSwitch v-model="disallowUploadWhenPredictedAsPorn" class="_formBlock">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.disallowUploadWhenPredictedAsPorn }}</template>
						</FormSwitch>
						-->

						<FormButton primary class="_formBlock" @click="save"><i class="fas fa-save"></i> {{ i18n.ts.save }}</FormButton>
					</div>
				</FormFolder>

				<FormFolder class="_formBlock">
					<template #label>Active Email Validation</template>
					<template v-if="enableActiveEmailValidation" #suffix>Enabled</template>
					<template v-else #suffix>Disabled</template>

					<div class="_formRoot">
						<span class="_formBlock">{{ i18n.ts.activeEmailValidationDescription }}</span>
						<FormSwitch v-model="enableActiveEmailValidation" class="_formBlock" @update:modelValue="save">
							<template #label>Enable</template>
						</FormSwitch>
					</div>
				</FormFolder>

				<FormFolder class="_formBlock">
					<template #label>Log IP address</template>
					<template v-if="enableIpLogging" #suffix>Enabled</template>
					<template v-else #suffix>Disabled</template>

					<div class="_formRoot">
						<FormSwitch v-model="enableIpLogging" class="_formBlock" @update:modelValue="save">
							<template #label>Enable</template>
						</FormSwitch>
					</div>
				</FormFolder>

				<FormFolder class="_formBlock">
					<template #label>Summaly Proxy</template>

					<div class="_formRoot">
						<FormInput v-model="summalyProxy" class="_formBlock">
							<template #prefix><i class="fas fa-link"></i></template>
							<template #label>Summaly Proxy URL</template>
						</FormInput>

						<FormButton primary class="_formBlock" @click="save"><i class="fas fa-save"></i> {{ i18n.ts.save }}</FormButton>
					</div>
				</FormFolder>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XBotProtection from './bot-protection.vue';
import XHeader from './_header_.vue';
import FormFolder from '@/components/form/folder.vue';
import FormRadios from '@/components/form/radios.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInfo from '@/components/MkInfo.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormRange from '@/components/form/range.vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let summalyProxy: string = $ref('');
let enableHcaptcha: boolean = $ref(false);
let enableRecaptcha: boolean = $ref(false);
let enableTurnstile: boolean = $ref(false);
let sensitiveMediaDetection: string = $ref('none');
let sensitiveMediaDetectionSensitivity: number = $ref(0);
let setSensitiveFlagAutomatically: boolean = $ref(false);
let enableSensitiveMediaDetectionForVideos: boolean = $ref(false);
let enableIpLogging: boolean = $ref(false);
let enableActiveEmailValidation: boolean = $ref(false);

async function init() {
	const meta = await os.api('admin/meta');
	summalyProxy = meta.summalyProxy;
	enableHcaptcha = meta.enableHcaptcha;
	enableRecaptcha = meta.enableRecaptcha;
	enableTurnstile = meta.enableTurnstile;
	sensitiveMediaDetection = meta.sensitiveMediaDetection;
	sensitiveMediaDetectionSensitivity =
		meta.sensitiveMediaDetectionSensitivity === 'veryLow' ? 0 :
		meta.sensitiveMediaDetectionSensitivity === 'low' ? 1 :
		meta.sensitiveMediaDetectionSensitivity === 'medium' ? 2 :
		meta.sensitiveMediaDetectionSensitivity === 'high' ? 3 :
		meta.sensitiveMediaDetectionSensitivity === 'veryHigh' ? 4 : 0;
	setSensitiveFlagAutomatically = meta.setSensitiveFlagAutomatically;
	enableSensitiveMediaDetectionForVideos = meta.enableSensitiveMediaDetectionForVideos;
	enableIpLogging = meta.enableIpLogging;
	enableActiveEmailValidation = meta.enableActiveEmailValidation;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		summalyProxy,
		sensitiveMediaDetection,
		sensitiveMediaDetectionSensitivity:
			sensitiveMediaDetectionSensitivity === 0 ? 'veryLow' :
			sensitiveMediaDetectionSensitivity === 1 ? 'low' :
			sensitiveMediaDetectionSensitivity === 2 ? 'medium' :
			sensitiveMediaDetectionSensitivity === 3 ? 'high' :
			sensitiveMediaDetectionSensitivity === 4 ? 'veryHigh' :
			0,
		setSensitiveFlagAutomatically,
		enableSensitiveMediaDetectionForVideos,
		enableIpLogging,
		enableActiveEmailValidation,
	}).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.security,
	icon: 'fas fa-lock',
});
</script>
