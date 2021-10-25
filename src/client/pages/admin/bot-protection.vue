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
			<div class="_debobigegoItem _debobigegoNoConcat" v-sticky-container>
				<div class="_debobigegoLabel">hCaptcha</div>
				<div class="main">
					<FormInput v-model="hcaptchaSiteKey">
						<template #prefix><i class="fas fa-key"></i></template>
						<span>{{ $ts.hcaptchaSiteKey }}</span>
					</FormInput>
					<FormInput v-model="hcaptchaSecretKey">
						<template #prefix><i class="fas fa-key"></i></template>
						<span>{{ $ts.hcaptchaSecretKey }}</span>
					</FormInput>
				</div>
			</div>
			<div class="_debobigegoItem _debobigegoNoConcat" v-sticky-container>
				<div class="_debobigegoLabel">{{ $ts.preview }}</div>
				<div class="_debobigegoPanel" style="padding: var(--debobigegoContentHMargin);">
					<MkCaptcha provider="hcaptcha" :sitekey="hcaptchaSiteKey || '10000000-ffff-ffff-ffff-000000000001'"/>
				</div>
			</div>
		</template>
		<template v-else-if="provider === 'recaptcha'">
			<div class="_debobigegoItem _debobigegoNoConcat" v-sticky-container>
				<div class="_debobigegoLabel">reCAPTCHA</div>
				<div class="main">
					<FormInput v-model="recaptchaSiteKey">
						<template #prefix><i class="fas fa-key"></i></template>
						<span>{{ $ts.recaptchaSiteKey }}</span>
					</FormInput>
					<FormInput v-model="recaptchaSecretKey">
						<template #prefix><i class="fas fa-key"></i></template>
						<span>{{ $ts.recaptchaSecretKey }}</span>
					</FormInput>
				</div>
			</div>
			<div v-if="recaptchaSiteKey" class="_debobigegoItem _debobigegoNoConcat" v-sticky-container>
				<div class="_debobigegoLabel">{{ $ts.preview }}</div>
				<div class="_debobigegoPanel" style="padding: var(--debobigegoContentHMargin);">
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
import FormRadios from '@client/components/debobigego/radios.vue';
import FormInput from '@client/components/debobigego/input.vue';
import FormButton from '@client/components/debobigego/button.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormGroup from '@client/components/debobigego/group.vue';
import FormInfo from '@client/components/debobigego/info.vue';
import FormSuspense from '@client/components/debobigego/suspense.vue';
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
