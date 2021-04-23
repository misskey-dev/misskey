<template>
<FormBase>
	<FormSuspense :p="init">
		<FormRadios v-model="provider">
			<template #desc><i class="fas fa-shield-alt"></i> {{ $ts.botProtection }}</template>
			<option :value="null">{{ $ts.none }} ({{ $ts.notRecommended }})</option>
			<option value="hcaptcha">hCaptcha</option>
			<option value="recaptcha">reCAPTCHA</option>
		</FormRadios>

		<template v-if="provider === 'hcaptcha'">
			<div class="_formItem _formNoConcat" v-sticky-container>
				<div class="_formLabel">hCaptcha</div>
				<div class="main">
					<FormInput v-model:value="hcaptchaSiteKey">
						<template #prefix><i class="fas fa-key"></i></template>
						<span>{{ $ts.hcaptchaSiteKey }}</span>
					</FormInput>
					<FormInput v-model:value="hcaptchaSecretKey">
						<template #prefix><i class="fas fa-key"></i></template>
						<span>{{ $ts.hcaptchaSecretKey }}</span>
					</FormInput>
				</div>
			</div>
			<div class="_formItem _formNoConcat" v-sticky-container>
				<div class="_formLabel">{{ $ts.preview }}</div>
				<div class="_formPanel" style="padding: var(--formContentHMargin);">
					<MkCaptcha provider="hcaptcha" :sitekey="hcaptchaSiteKey || '10000000-ffff-ffff-ffff-000000000001'"/>
				</div>
			</div>
		</template>
		<template v-else-if="provider === 'recaptcha'">
			<div class="_formItem _formNoConcat" v-sticky-container>
				<div class="_formLabel">reCAPTCHA</div>
				<div class="main">
					<FormInput v-model:value="recaptchaSiteKey">
						<template #prefix><i class="fas fa-key"></i></template>
						<span>{{ $ts.recaptchaSiteKey }}</span>
					</FormInput>
					<FormInput v-model:value="recaptchaSecretKey">
						<template #prefix><i class="fas fa-key"></i></template>
						<span>{{ $ts.recaptchaSecretKey }}</span>
					</FormInput>
				</div>
			</div>
			<div v-if="recaptchaSiteKey" class="_formItem _formNoConcat" v-sticky-container>
				<div class="_formLabel">{{ $ts.preview }}</div>
				<div class="_formPanel" style="padding: var(--formContentHMargin);">
					<MkCaptcha provider="recaptcha" :sitekey="recaptchaSiteKey"/>
				</div>
			</div>
		</template>

		<FormButton @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormRadios from '@client/components/form/radios.vue';
import FormInput from '@client/components/form/input.vue';
import FormButton from '@client/components/form/button.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormInfo from '@client/components/form/info.vue';
import FormSuspense from '@client/components/form/suspense.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import { fetchInstance } from '@client/instance';

export default defineComponent({
	components: {
		FormRadios,
		FormInput,
		FormBase,
		FormGroup,
		FormButton,
		FormInfo,
		FormSuspense,
		MkCaptcha: defineAsyncComponent(() => import('@client/components/captcha.vue')),
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.botProtection,
				icon: 'fas fa-shield-alt'
			},
			provider: null,
			enableHcaptcha: false,
			hcaptchaSiteKey: null,
			hcaptchaSecretKey: null,
			enableRecaptcha: false,
			recaptchaSiteKey: null,
			recaptchaSecretKey: null,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.enableHcaptcha = meta.enableHcaptcha;
			this.hcaptchaSiteKey = meta.hcaptchaSiteKey;
			this.hcaptchaSecretKey = meta.hcaptchaSecretKey;
			this.enableRecaptcha = meta.enableRecaptcha;
			this.recaptchaSiteKey = meta.recaptchaSiteKey;
			this.recaptchaSecretKey = meta.recaptchaSecretKey;

			this.provider = this.enableHcaptcha ? 'hcaptcha' : this.enableRecaptcha ? 'recaptcha' : null;

			this.$watch(() => this.provider, () => {
				this.enableHcaptcha = this.provider === 'hcaptcha';
				this.enableRecaptcha = this.provider === 'recaptcha';
			});
		},
	
		save() {
			os.apiWithDialog('admin/update-meta', {
				enableHcaptcha: this.enableHcaptcha,
				hcaptchaSiteKey: this.hcaptchaSiteKey,
				hcaptchaSecretKey: this.hcaptchaSecretKey,
				enableRecaptcha: this.enableRecaptcha,
				recaptchaSiteKey: this.recaptchaSiteKey,
				recaptchaSecretKey: this.recaptchaSecretKey,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
