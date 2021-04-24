<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model:value="enableEmail">{{ $ts.enableEmail }}<template #desc>{{ $ts.emailConfigInfo }}</template></FormSwitch>

		<template v-if="enableEmail">
			<FormInput v-model:value="email" type="email">
				<span>{{ $ts.emailAddress }}</span>
			</FormInput>

			<div class="_formItem _formNoConcat" v-sticky-container>
				<div class="_formLabel">{{ $ts.smtpConfig }}</div>
				<div class="main">
					<FormInput v-model:value="smtpHost">
						<span>{{ $ts.smtpHost }}</span>
					</FormInput>
					<FormInput v-model:value="smtpPort" type="number">
						<span>{{ $ts.smtpPort }}</span>
					</FormInput>
					<FormInput v-model:value="smtpUser">
						<span>{{ $ts.smtpUser }}</span>
					</FormInput>
					<FormInput v-model:value="smtpPass" type="password">
						<span>{{ $ts.smtpPass }}</span>
					</FormInput>
					<FormInfo>{{ $ts.emptyToDisableSmtpAuth }}</FormInfo>
					<FormSwitch v-model:value="smtpSecure">{{ $ts.smtpSecure }}<template #desc>{{ $ts.smtpSecureInfo }}</template></FormSwitch>
				</div>
			</div>

			<FormButton @click="testEmail">{{ $ts.testEmail }}</FormButton>
		</template>

		<FormButton @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@client/components/form/switch.vue';
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
		FormSwitch,
		FormInput,
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
				title: this.$ts.emailServer,
				icon: 'fas fa-envelope'
			},
			enableEmail: false,
			email: null,
			smtpSecure: false,
			smtpHost: '',
			smtpPort: 0,
			smtpUser: '',
			smtpPass: '',
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.enableEmail = meta.enableEmail;
			this.email = meta.email;
			this.smtpSecure = meta.smtpSecure;
			this.smtpHost = meta.smtpHost;
			this.smtpPort = meta.smtpPort;
			this.smtpUser = meta.smtpUser;
			this.smtpPass = meta.smtpPass;
		},

		async testEmail() {
			const { canceled, result: destination } = await os.dialog({
				title: this.$ts.destination,
				input: {
					placeholder: this.$instance.maintainerEmail
				}
			});
			if (canceled) return;
			os.apiWithDialog('admin/send-email', {
				to: destination,
				subject: 'Test email',
				text: 'Yo'
			});
		},

		save() {
			os.apiWithDialog('admin/update-meta', {
				enableEmail: this.enableEmail,
				email: this.email,
				smtpSecure: this.smtpSecure,
				smtpHost: this.smtpHost,
				smtpPort: this.smtpPort,
				smtpUser: this.smtpUser,
				smtpPass: this.smtpPass,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
