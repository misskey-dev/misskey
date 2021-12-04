<template>
<FormBase>
	<FormSuspense :p="init">
		<FormLink to="/admin/bot-protection">
			<i class="fas fa-shield-alt"></i> {{ $ts.botProtection }}
			<template v-if="enableHcaptcha" #suffix>hCaptcha</template>
			<template v-else-if="enableRecaptcha" #suffix>reCAPTCHA</template>
			<template v-else #suffix>{{ $ts.none }} ({{ $ts.notRecommended }})</template>
		</FormLink>

		<FormSwitch v-model="enableRegistration">{{ $ts.enableRegistration }}</FormSwitch>

		<FormSwitch v-model="emailRequiredForSignup">{{ $ts.emailRequiredForSignup }}</FormSwitch>

		<FormButton primary @click="save"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormLink from '@/components/debobigego/link.vue';
import FormSwitch from '@/components/debobigego/switch.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormInfo from '@/components/debobigego/info.vue';
import FormSuspense from '@/components/debobigego/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormLink,
		FormSwitch,
		FormBase,
		FormGroup,
		FormButton,
		FormInfo,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.security,
				icon: 'fas fa-lock',
				bg: 'var(--bg)',
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
