<template>
<FormBase>
	<FormSuspense :p="init">
		<FormLink to="/admin/bot-protection">
			<i class="fas fa-shield-alt"></i> {{ $ts.botProtection }}
			<template #suffix v-if="enableHcaptcha">hCaptcha</template>
			<template #suffix v-else-if="enableRecaptcha">reCAPTCHA</template>
			<template #suffix v-else>{{ $ts.none }} ({{ $ts.notRecommended }})</template>
		</FormLink>

		<FormSwitch v-model="enableRegistration">{{ $ts.enableRegistration }}</FormSwitch>

		<FormSwitch v-model="emailRequiredForSignup">{{ $ts.emailRequiredForSignup }}</FormSwitch>

		<FormButton @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormLink from '@client/components/debobigego/link.vue';
import FormSwitch from '@client/components/debobigego/switch.vue';
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
