<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<div class="_formRoot">
			<FormFolder class="_formBlock">
				<template #icon><i class="fas fa-shield-alt"></i></template>
				<template #label>{{ i18n.ts.botProtection }}</template>
				<template v-if="enableHcaptcha" #suffix>hCaptcha</template>
				<template v-else-if="enableRecaptcha" #suffix>reCAPTCHA</template>
				<template v-else #suffix>{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</template>

				<XBotProtection/>
			</FormFolder>

			<FormFolder class="_formBlock">
				<template #icon><i class="fas fa-eye-slash"></i></template>
				<template #label>{{ i18n.ts.sensitiveImageDetection }}</template>
				<template v-if="sensitiveImageDetection === 'all'" #suffix>{{ i18n.ts.all }}</template>
				<template v-else-if="sensitiveImageDetection === 'local'" #suffix>{{ i18n.ts.localOnly }}</template>
				<template v-else-if="sensitiveImageDetection === 'remote'" #suffix>{{ i18n.ts.remoteOnly }}</template>
				<template v-else #suffix>{{ i18n.ts.none }}</template>

				<div class="_formRoot">
					<span class="_formBlock">{{ i18n.ts._sensitiveImageDetection.description }}</span>

					<FormRadios v-model="sensitiveImageDetection" class="_formBlock">
						<option value="none">{{ i18n.ts.none }}</option>
						<option value="all">{{ i18n.ts.all }}</option>
						<option value="local">{{ i18n.ts.localOnly }}</option>
						<option value="remote">{{ i18n.ts.remoteOnly }}</option>
					</FormRadios>

					<FormRange v-model="sensitiveImageDetectionSensitivity" :min="0" :max="4" :step="1" :text-converter="(v) => `${v + 1}`" class="_formBlock">
						<template #label>{{ i18n.ts._sensitiveImageDetection.sensitivity }}</template>
						<template #caption>{{ i18n.ts._sensitiveImageDetection.sensitivityDescription }}</template>
					</FormRange>

					<FormSwitch v-model="forceIsSensitiveWhenPredicted" class="_formBlock">
						<template #label>{{ i18n.ts._sensitiveImageDetection.forceIsSensitiveWhenPredicted }}</template>
					</FormSwitch>

					<FormSwitch v-model="disallowUploadWhenPredictedAsPorn" class="_formBlock">
						<template #label>{{ i18n.ts._sensitiveImageDetection.disallowUploadWhenPredictedAsPorn }}</template>
					</FormSwitch>

					<FormButton primary class="_formBlock" @click="save"><i class="fas fa-save"></i> {{ i18n.ts.save }}</FormButton>
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
</template>

<script lang="ts" setup>
import { } from 'vue';
import XBotProtection from './bot-protection.vue';
import FormFolder from '@/components/form/folder.vue';
import FormRadios from '@/components/form/radios.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInfo from '@/components/ui/info.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormRange from '@/components/form/range.vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';

let summalyProxy: string = $ref('');
let enableHcaptcha: boolean = $ref(false);
let enableRecaptcha: boolean = $ref(false);
let sensitiveImageDetection: string = $ref('none');
let sensitiveImageDetectionSensitivity: number = $ref(0);
let forceIsSensitiveWhenPredicted: boolean = $ref(false);
let disallowUploadWhenPredictedAsPorn: boolean = $ref(false);

async function init() {
	const meta = await os.api('admin/meta');
	summalyProxy = meta.summalyProxy;
	enableHcaptcha = meta.enableHcaptcha;
	enableRecaptcha = meta.enableRecaptcha;
	sensitiveImageDetection = meta.sensitiveImageDetection;
	sensitiveImageDetectionSensitivity =
		meta.sensitiveImageDetectionSensitivity === 'veryLow' ? 0 :
		meta.sensitiveImageDetectionSensitivity === 'low' ? 1 :
		meta.sensitiveImageDetectionSensitivity === 'medium' ? 2 :
		meta.sensitiveImageDetectionSensitivity === 'high' ? 3 :
		meta.sensitiveImageDetectionSensitivity === 'veryHigh' ? 4 : 0;
	forceIsSensitiveWhenPredicted = meta.forceIsSensitiveWhenPredicted;
	disallowUploadWhenPredictedAsPorn = meta.disallowUploadWhenPredictedAsPorn;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		summalyProxy,
		sensitiveImageDetection,
		forceIsSensitiveWhenPredicted,
		sensitiveImageDetectionSensitivity:
			sensitiveImageDetectionSensitivity === 0 ? 'veryLow' :
			sensitiveImageDetectionSensitivity === 1 ? 'low' :
			sensitiveImageDetectionSensitivity === 2 ? 'medium' :
			sensitiveImageDetectionSensitivity === 3 ? 'high' :
			sensitiveImageDetectionSensitivity === 4 ? 'veryHigh' :
			0,
		disallowUploadWhenPredictedAsPorn,
	}).then(() => {
		fetchInstance();
	});
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.security,
		icon: 'fas fa-lock',
		bg: 'var(--bg)',
	},
});
</script>
