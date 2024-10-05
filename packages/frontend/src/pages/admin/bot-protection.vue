<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #icon><i class="ti ti-shield"></i></template>
	<template #label>{{ i18n.ts.botProtection }}</template>
	<template v-if="botProtectionForm.savedState.provider === 'hcaptcha'" #suffix>hCaptcha</template>
	<template v-else-if="botProtectionForm.savedState.provider === 'mcaptcha'" #suffix>mCaptcha</template>
	<template v-else-if="botProtectionForm.savedState.provider === 'recaptcha'" #suffix>reCAPTCHA</template>
	<template v-else-if="botProtectionForm.savedState.provider === 'turnstile'" #suffix>Turnstile</template>
	<template v-else #suffix>{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</template>
	<template v-if="botProtectionForm.modified.value" #footer>
		<MkFormFooter :form="botProtectionForm"/>
	</template>

	<div class="_gaps_m">
		<MkRadios v-model="botProtectionForm.state.provider">
			<option :value="null">{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</option>
			<option value="hcaptcha">hCaptcha</option>
			<option value="mcaptcha">mCaptcha</option>
			<option value="recaptcha">reCAPTCHA</option>
			<option value="turnstile">Turnstile</option>
		</MkRadios>

		<template v-if="botProtectionForm.state.provider === 'hcaptcha'">
			<MkInput v-model="botProtectionForm.state.hcaptchaSiteKey">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>{{ i18n.ts.hcaptchaSiteKey }}</template>
			</MkInput>
			<MkInput v-model="botProtectionForm.state.hcaptchaSecretKey">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>{{ i18n.ts.hcaptchaSecretKey }}</template>
			</MkInput>
			<FormSlot>
				<template #label>{{ i18n.ts.preview }}</template>
				<MkCaptcha provider="hcaptcha" :sitekey="botProtectionForm.state.hcaptchaSiteKey || '10000000-ffff-ffff-ffff-000000000001'"/>
			</FormSlot>
		</template>
		<template v-else-if="botProtectionForm.state.provider === 'mcaptcha'">
			<MkInput v-model="botProtectionForm.state.mcaptchaSiteKey">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>{{ i18n.ts.mcaptchaSiteKey }}</template>
			</MkInput>
			<MkInput v-model="botProtectionForm.state.mcaptchaSecretKey">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>{{ i18n.ts.mcaptchaSecretKey }}</template>
			</MkInput>
			<MkInput v-model="botProtectionForm.state.mcaptchaInstanceUrl">
				<template #prefix><i class="ti ti-link"></i></template>
				<template #label>{{ i18n.ts.mcaptchaInstanceUrl }}</template>
			</MkInput>
			<FormSlot v-if="botProtectionForm.state.mcaptchaSiteKey && botProtectionForm.state.mcaptchaInstanceUrl">
				<template #label>{{ i18n.ts.preview }}</template>
				<MkCaptcha provider="mcaptcha" :sitekey="botProtectionForm.state.mcaptchaSiteKey" :instanceUrl="botProtectionForm.state.mcaptchaInstanceUrl"/>
			</FormSlot>
		</template>
		<template v-else-if="botProtectionForm.state.provider === 'recaptcha'">
			<MkInput v-model="botProtectionForm.state.recaptchaSiteKey">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>{{ i18n.ts.recaptchaSiteKey }}</template>
			</MkInput>
			<MkInput v-model="botProtectionForm.state.recaptchaSecretKey">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>{{ i18n.ts.recaptchaSecretKey }}</template>
			</MkInput>
			<FormSlot v-if="botProtectionForm.state.recaptchaSiteKey">
				<template #label>{{ i18n.ts.preview }}</template>
				<MkCaptcha provider="recaptcha" :sitekey="botProtectionForm.state.recaptchaSiteKey"/>
			</FormSlot>
		</template>
		<template v-else-if="botProtectionForm.state.provider === 'turnstile'">
			<MkInput v-model="botProtectionForm.state.turnstileSiteKey">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>{{ i18n.ts.turnstileSiteKey }}</template>
			</MkInput>
			<MkInput v-model="botProtectionForm.state.turnstileSecretKey">
				<template #prefix><i class="ti ti-key"></i></template>
				<template #label>{{ i18n.ts.turnstileSecretKey }}</template>
			</MkInput>
			<FormSlot>
				<template #label>{{ i18n.ts.preview }}</template>
				<MkCaptcha provider="turnstile" :sitekey="botProtectionForm.state.turnstileSiteKey || '1x00000000000000000000AA'"/>
			</FormSlot>
		</template>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import MkRadios from '@/components/MkRadios.vue';
import MkInput from '@/components/MkInput.vue';
import FormSlot from '@/components/form/slot.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { useForm } from '@/scripts/use-form.js';
import MkFormFooter from '@/components/MkFormFooter.vue';
import MkFolder from '@/components/MkFolder.vue';

const MkCaptcha = defineAsyncComponent(() => import('@/components/MkCaptcha.vue'));

const meta = await misskeyApi('admin/meta');

const botProtectionForm = useForm({
	provider: meta.enableHcaptcha
		? 'hcaptcha'
		: meta.enableRecaptcha
			? 'recaptcha'
			: meta.enableTurnstile
				? 'turnstile'
				: meta.enableMcaptcha
					? 'mcaptcha'
					: null,
	hcaptchaSiteKey: meta.hcaptchaSiteKey,
	hcaptchaSecretKey: meta.hcaptchaSecretKey,
	mcaptchaSiteKey: meta.mcaptchaSiteKey,
	mcaptchaSecretKey: meta.mcaptchaSecretKey,
	mcaptchaInstanceUrl: meta.mcaptchaInstanceUrl,
	recaptchaSiteKey: meta.recaptchaSiteKey,
	recaptchaSecretKey: meta.recaptchaSecretKey,
	turnstileSiteKey: meta.turnstileSiteKey,
	turnstileSecretKey: meta.turnstileSecretKey,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableHcaptcha: state.provider === 'hcaptcha',
		hcaptchaSiteKey: state.hcaptchaSiteKey,
		hcaptchaSecretKey: state.hcaptchaSecretKey,
		enableMcaptcha: state.provider === 'mcaptcha',
		mcaptchaSiteKey: state.mcaptchaSiteKey,
		mcaptchaSecretKey: state.mcaptchaSecretKey,
		mcaptchaInstanceUrl: state.mcaptchaInstanceUrl,
		enableRecaptcha: state.provider === 'recaptcha',
		recaptchaSiteKey: state.recaptchaSiteKey,
		recaptchaSecretKey: state.recaptchaSecretKey,
		enableTurnstile: state.provider === 'turnstile',
		turnstileSiteKey: state.turnstileSiteKey,
		turnstileSecretKey: state.turnstileSecretKey,
	});
	fetchInstance(true);
});
</script>
