<template>
<FormBase>
	<FormSuspense :p="init">
		<FormLink to="/instance/bot-protection">
			<i class="fas fa-shield-alt"></i> {{ $ts.botProtection }}
			<template #suffix v-if="enableHcaptcha">hCaptcha</template>
			<template #suffix v-else-if="enableRecaptcha">reCAPTCHA</template>
			<template #suffix v-else>{{ $ts.none }} ({{ $ts.notRecommended }})</template>
		</FormLink>

		<FormSwitch v-model:value="enableRegistration">{{ $ts.enableRegistration }}</FormSwitch>
		<FormSwitch v-model:value="secureMode" v-if="!privateMode">
			{{ $ts.secureMode }}
			<template #desc>{{ $ts.secureModeInfo }}</template>
		</FormSwitch>
		<FormSwitch v-model:value="privateMode">
			{{ $ts.privateMode }}
			<template #desc>{{ $ts.privateModeInfo }}</template>
		</FormSwitch>
		<FormTextarea v-model:value="allowedHosts" disabled="{{!privateMode}}">
			<span>{{ $ts.allowedInstances }}</span>
			<template #desc>{{ $ts.allowedInstancesDescription }}</template>
		</FormTextarea>

		<FormButton @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormLink from '@client/components/form/link.vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormButton from '@client/components/form/button.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormInfo from '@client/components/form/info.vue';
import FormSuspense from '@client/components/form/suspense.vue';
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
		FormTextarea
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.security,
				icon: 'fas fa-lock'
			},
			enableHcaptcha: false,
			enableRecaptcha: false,
			enableRegistration: false,

			secureMode: false,
			privateMode: false,
			allowedHosts: ''
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
			// TODO: misskey.js更新
			// @ts-ignore
			this.secureMode = meta.secureMode;
			// @ts-ignore
			this.privateMode = meta.privateMode;
			// @ts-ignore
			this.allowedHosts = meta.allowedHosts.join('\n');
		},
	
		save() {
			os.apiWithDialog('admin/update-meta', {
				disableRegistration: !this.enableRegistration,
				secureMode: this.secureMode,
				privateMode: this.privateMode,
				allowedHosts: this.allowedHosts.split('\n')
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
