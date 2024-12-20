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
	<template v-else-if="botProtectionForm.savedState.provider === 'testcaptcha'" #suffix>testCaptcha</template>
	<template v-else #suffix>{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</template>
	<template #footer>
		<MkFormFooter :canSaving="canSaving" :form="botProtectionForm"/>
	</template>

	<div class="_gaps_m">
		<MkRadios v-model="botProtectionForm.state.provider">
			<option value="none">{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</option>
			<option value="hcaptcha">hCaptcha</option>
			<option value="mcaptcha">mCaptcha</option>
			<option value="recaptcha">reCAPTCHA</option>
			<option value="turnstile">Turnstile</option>
			<option value="testcaptcha">testCaptcha</option>
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
			<FormSlot v-if="botProtectionForm.state.hcaptchaSiteKey">
				<template #label>{{ i18n.ts.preview }}</template>
				<MkCaptcha v-model="captchaResult" provider="hcaptcha" :sitekey="botProtectionForm.state.hcaptchaSiteKey"/>
			</FormSlot>
			<MkInfo>
				<div :class="$style.captchaInfoMsg">
					<div>{{ i18n.tsx.testSiteKeyMessage({ testSiteKey: '10000000-ffff-ffff-ffff-000000000001' }) }}</div>
					<div>
						<span>ref: </span><a href="https://docs.hcaptcha.com/#integration-testing-test-keys" target="_blank">hCaptcha Developer Guide</a>
					</div>
				</div>
			</MkInfo>
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
				<MkCaptcha
					v-model="captchaResult" provider="mcaptcha" :sitekey="botProtectionForm.state.mcaptchaSiteKey"
					:instanceUrl="botProtectionForm.state.mcaptchaInstanceUrl"
				/>
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
				<MkCaptcha
					v-model="captchaResult" provider="recaptcha"
					:sitekey="botProtectionForm.state.recaptchaSiteKey"
				/>
			</FormSlot>
			<MkInfo>
				<div :class="$style.captchaInfoMsg">
					<div>{{ i18n.tsx.testSiteKeyMessage({ testSiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' }) }}</div>
					<div>
						<span>ref: </span>
						<a
							href="https://developers.google.com/recaptcha/docs/faq?hl=ja#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do"
							target="_blank"
						>reCAPTCHA FAQ</a>
					</div>
				</div>
			</MkInfo>
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
			<FormSlot v-if="botProtectionForm.state.turnstileSiteKey">
				<template #label>{{ i18n.ts.preview }}</template>
				<MkCaptcha
					v-model="captchaResult" provider="turnstile"
					:sitekey="botProtectionForm.state.turnstileSiteKey"
				/>
			</FormSlot>
			<MkInfo>
				<div :class="$style.captchaInfoMsg">
					<div :class="$style.noSpace">
						{{ i18n.tsx.testSiteKeyMessage({ testSiteKey: '1x00000000000000000000AA' }) }}
					</div>
					<div :class="$style.noSpace">
						<span>ref: </span><a href="https://developers.cloudflare.com/turnstile/troubleshooting/testing/" target="_blank">Cloudflare Docs</a>
					</div>
				</div>
			</MkInfo>
		</template>

		<template v-else-if="botProtectionForm.state.provider === 'testcaptcha'">
			<MkInfo warn><span v-html="i18n.ts.testCaptchaWarning"></span></MkInfo>
			<FormSlot>
				<template #label>{{ i18n.ts.preview }}</template>
				<MkCaptcha v-model="captchaResult" provider="testcaptcha" :sitekey="null"/>
			</FormSlot>
		</template>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
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
import MkInfo from '@/components/MkInfo.vue';

const MkCaptcha = defineAsyncComponent(() => import('@/components/MkCaptcha.vue'));

const captchaResult = ref<string | null>(null);

const meta = await misskeyApi('admin/captcha/current');
const botProtectionForm = useForm({
	provider: meta.provider,
	hcaptchaSiteKey: meta.hcaptcha.siteKey,
	hcaptchaSecretKey: meta.hcaptcha.secretKey,
	mcaptchaSiteKey: meta.mcaptcha.siteKey,
	mcaptchaSecretKey: meta.mcaptcha.secretKey,
	mcaptchaInstanceUrl: meta.mcaptcha.instanceUrl,
	recaptchaSiteKey: meta.recaptcha.siteKey,
	recaptchaSecretKey: meta.recaptcha.secretKey,
	turnstileSiteKey: meta.turnstile.siteKey,
	turnstileSecretKey: meta.turnstile.secretKey,
}, async (state) => {
	const provider = state.provider;

	const sitekey = provider === 'hcaptcha'
		? state.hcaptchaSiteKey
		: provider === 'mcaptcha'
			? state.mcaptchaSiteKey
			: provider === 'recaptcha'
				? state.recaptchaSiteKey
				: provider === 'turnstile'
					? state.turnstileSiteKey
					: null;
	const secret = provider === 'hcaptcha'
		? state.hcaptchaSecretKey
		: provider === 'mcaptcha'
			? state.mcaptchaSecretKey
			: provider === 'recaptcha'
				? state.recaptchaSecretKey
				: provider === 'turnstile'
					? state.turnstileSecretKey
					: null;

	if (provider === 'none') {
		await os.apiWithDialog(
			'admin/captcha/save',
			{ provider: provider as Misskey.entities.AdminCaptchaSaveRequest['provider'] },
		);
	} else {
		await os.apiWithDialog(
			'admin/captcha/save',
			{
				provider: provider as Misskey.entities.AdminCaptchaSaveRequest['provider'],
				sitekey: sitekey,
				secret: secret,
				instanceUrl: state.mcaptchaInstanceUrl,
				captchaResult: captchaResult.value,
			},
		);
	}

	await fetchInstance(true);
});

watch(botProtectionForm.state, () => {
	captchaResult.value = null;
});

const canSaving = computed((): boolean => {
	return (botProtectionForm.state.provider === 'none') ||
		(botProtectionForm.state.provider === 'hcaptcha' && !!captchaResult.value) ||
		(botProtectionForm.state.provider === 'mcaptcha' && !!captchaResult.value) ||
		(botProtectionForm.state.provider === 'recaptcha' && !!captchaResult.value) ||
		(botProtectionForm.state.provider === 'turnstile' && !!captchaResult.value) ||
		(botProtectionForm.state.provider === 'testcaptcha' && !!captchaResult.value);
});

</script>

<style lang="scss" module>
.captchaInfoMsg {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.noSpace {
	white-space-collapse: discard;
}
</style>
