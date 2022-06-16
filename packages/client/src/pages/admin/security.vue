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

				<div class="_formRoot">
					<FormRadios v-model="sensitiveImageDetection" class="_formBlock">
						<option value="none">{{ i18n.ts.none }}</option>
						<option value="all">{{ i18n.ts.all }}</option>
						<option value="local">{{ i18n.ts.localOnly }}</option>
						<option value="remote">{{ i18n.ts.remoteOnly }}</option>
					</FormRadios>

					<FormRadios v-model="sensitiveImageDetectionSensitivity" class="_formBlock">
						<template #label>{{ i18n.ts.sensitivity }}</template>
						<option value="low">{{ i18n.ts.low }}</option>
						<option value="medium">{{ i18n.ts.medium }}</option>
						<option value="high">{{ i18n.ts.high }}</option>
					</FormRadios>

					<FormSwitch v-model="forceIsSensitiveWhenPredicted" class="_formBlock">
						<template #label>{{ i18n.ts.forceIsSensitiveWhenPredicted }}</template>
					</FormSwitch>

					<FormSwitch v-model="disallowUploadWhenPredictedAsPorn" class="_formBlock">
						<template #label>{{ i18n.ts.disallowUploadWhenPredictedAsPorn }}</template>
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
import FormSection from '@/components/form/section.vue';
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
let sensitiveImageDetectionSensitivity: string = $ref('medium');
let forceIsSensitiveWhenPredicted: boolean = $ref(false);
let disallowUploadWhenPredictedAsPorn: boolean = $ref(false);

async function init() {
	const meta = await os.api('admin/meta');
	summalyProxy = meta.summalyProxy;
	enableHcaptcha = meta.enableHcaptcha;
	enableRecaptcha = meta.enableRecaptcha;
	sensitiveImageDetection = meta.sensitiveImageDetection;
	sensitiveImageDetectionSensitivity = meta.sensitiveImageDetectionSensitivity;
	forceIsSensitiveWhenPredicted = meta.forceIsSensitiveWhenPredicted;
	disallowUploadWhenPredictedAsPorn = meta.disallowUploadWhenPredictedAsPorn;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		summalyProxy,
		sensitiveImageDetection,
		forceIsSensitiveWhenPredicted,
		sensitiveImageDetectionSensitivity,
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
