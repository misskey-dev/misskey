<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<FormSuspense :p="init">
		<div class="_gaps_m">
			<MkRadios v-model="provider">
				<option :value="null">{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</option>
				<option value="hcaptcha">hCaptcha</option>
				<option value="mcaptcha">mCaptcha</option>
				<option value="recaptcha">reCAPTCHA</option>
				<option value="turnstile">Turnstile</option>
			</MkRadios>

			<template v-if="provider === 'hcaptcha'">
				<MkInput v-model="hcaptchaSiteKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.hcaptchaSiteKey }}</template>
				</MkInput>
				<MkInput v-model="hcaptchaSecretKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.hcaptchaSecretKey }}</template>
				</MkInput>
				<FormSlot>
					<template #label>{{ i18n.ts.preview }}</template>
					<MkCaptcha provider="hcaptcha" :sitekey="hcaptchaSiteKey || '10000000-ffff-ffff-ffff-000000000001'"/>
				</FormSlot>
			</template>
			<template v-else-if="provider === 'mcaptcha'">
				<MkInput v-model="mcaptchaSiteKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.mcaptchaSiteKey }}</template>
				</MkInput>
				<MkInput v-model="mcaptchaSecretKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.mcaptchaSecretKey }}</template>
				</MkInput>
				<MkInput v-model="mcaptchaInstanceUrl">
					<template #prefix><i class="ti ti-link"></i></template>
					<template #label>{{ i18n.ts.mcaptchaInstanceUrl }}</template>
				</MkInput>
				<FormSlot v-if="mcaptchaSiteKey && mcaptchaInstanceUrl">
					<template #label>{{ i18n.ts.preview }}</template>
					<MkCaptcha provider="mcaptcha" :sitekey="mcaptchaSiteKey" :instanceUrl="mcaptchaInstanceUrl"/>
				</FormSlot>
			</template>
			<template v-else-if="provider === 'recaptcha'">
				<MkInput v-model="recaptchaSiteKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.recaptchaSiteKey }}</template>
				</MkInput>
				<MkInput v-model="recaptchaSecretKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.recaptchaSecretKey }}</template>
				</MkInput>
				<FormSlot v-if="recaptchaSiteKey">
					<template #label>{{ i18n.ts.preview }}</template>
					<MkCaptcha provider="recaptcha" :sitekey="recaptchaSiteKey"/>
				</FormSlot>
			</template>
			<template v-else-if="provider === 'turnstile'">
				<MkInput v-model="turnstileSiteKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.turnstileSiteKey }}</template>
				</MkInput>
				<MkInput v-model="turnstileSecretKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.turnstileSecretKey }}</template>
				</MkInput>
				<FormSlot>
					<template #label>{{ i18n.ts.preview }}</template>
					<MkCaptcha provider="turnstile" :sitekey="turnstileSiteKey || '1x00000000000000000000AA'"/>
				</FormSlot>
			</template>

			<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
		</div>
	</FormSuspense>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import type { CaptchaProvider } from '@/components/MkCaptcha.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSlot from '@/components/form/slot.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';

const MkCaptcha = defineAsyncComponent(() => import('@/components/MkCaptcha.vue'));

const provider = ref<CaptchaProvider | null>(null);
const hcaptchaSiteKey = ref<string | null>(null);
const hcaptchaSecretKey = ref<string | null>(null);
const mcaptchaSiteKey = ref<string | null>(null);
const mcaptchaSecretKey = ref<string | null>(null);
const mcaptchaInstanceUrl = ref<string | null>(null);
const recaptchaSiteKey = ref<string | null>(null);
const recaptchaSecretKey = ref<string | null>(null);
const turnstileSiteKey = ref<string | null>(null);
const turnstileSecretKey = ref<string | null>(null);

async function init() {
	const meta = await misskeyApi('admin/meta');
	hcaptchaSiteKey.value = meta.hcaptchaSiteKey;
	hcaptchaSecretKey.value = meta.hcaptchaSecretKey;
	mcaptchaSiteKey.value = meta.mcaptchaSiteKey;
	mcaptchaSecretKey.value = meta.mcaptchaSecretKey;
	mcaptchaInstanceUrl.value = meta.mcaptchaInstanceUrl;
	recaptchaSiteKey.value = meta.recaptchaSiteKey;
	recaptchaSecretKey.value = meta.recaptchaSecretKey;
	turnstileSiteKey.value = meta.turnstileSiteKey;
	turnstileSecretKey.value = meta.turnstileSecretKey;

	provider.value = meta.enableHcaptcha ? 'hcaptcha' :
		meta.enableRecaptcha ? 'recaptcha' :
		meta.enableTurnstile ? 'turnstile' :
		meta.enableMcaptcha ? 'mcaptcha' : null;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableHcaptcha: provider.value === 'hcaptcha',
		hcaptchaSiteKey: hcaptchaSiteKey.value,
		hcaptchaSecretKey: hcaptchaSecretKey.value,
		enableMcaptcha: provider.value === 'mcaptcha',
		mcaptchaSiteKey: mcaptchaSiteKey.value,
		mcaptchaSecretKey: mcaptchaSecretKey.value,
		mcaptchaInstanceUrl: mcaptchaInstanceUrl.value,
		enableRecaptcha: provider.value === 'recaptcha',
		recaptchaSiteKey: recaptchaSiteKey.value,
		recaptchaSecretKey: recaptchaSecretKey.value,
		enableTurnstile: provider.value === 'turnstile',
		turnstileSiteKey: turnstileSiteKey.value,
		turnstileSecretKey: turnstileSecretKey.value,
	}).then(() => {
		fetchInstance();
	});
}
</script>
