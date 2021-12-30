<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<div class="_formRoot">
			<FormSection>
				<FormSwitch v-model="enableRegistration" class="_formBlock">
					<template #label>{{ $ts.enableRegistration }}</template>
				</FormSwitch>

				<FormSwitch v-model="emailRequiredForSignup" class="_formBlock">
					<template #label>{{ $ts.emailRequiredForSignup }}</template>
				</FormSwitch>
			</FormSection>

			<FormLink to="/admin/bot-protection" class="_formBlock">
				<i class="fas fa-shield-alt"></i> {{ $ts.botProtection }}
				<template v-if="enableHcaptcha" #suffix>hCaptcha</template>
				<template v-else-if="enableRecaptcha" #suffix>reCAPTCHA</template>
				<template v-else #suffix>{{ $ts.none }} ({{ $ts.notRecommended }})</template>
			</FormLink>
		</div>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormLink from '@/components/form/link.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInfo from '@/components/ui/info.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormLink,
		FormSwitch,
		FormInfo,
		FormSection,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.security,
				icon: 'fas fa-lock',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					icon: 'fas fa-check',
					text: this.$ts.save,
					handler: this.save,
				}],
			},
			enableHcaptcha: false,
			enableRecaptcha: false,
			enableRegistration: false,
			emailRequiredForSignup: false,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.enableHcaptcha = meta.enableHcaptcha;
			this.enableRecaptcha = meta.enableRecaptcha;
			this.enableRegistration = !meta.disableRegistration;
			this.emailRequiredForSignup = meta.emailRequiredForSignup;
		},
	
		save() {
			os.apiWithDialog('admin/update-meta', {
				disableRegistration: !this.enableRegistration,
				emailRequiredForSignup: this.emailRequiredForSignup,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
