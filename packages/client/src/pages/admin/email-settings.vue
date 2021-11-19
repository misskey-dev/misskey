<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model="enableEmail">{{ $ts.enableEmail }}<template #desc>{{ $ts.emailConfigInfo }}</template></FormSwitch>

		<template v-if="enableEmail">
			<FormInput v-model="email" type="email">
				<span>{{ $ts.emailAddress }}</span>
			</FormInput>

			<div v-sticky-container class="_debobigegoItem _debobigegoNoConcat">
				<div class="_debobigegoLabel">{{ $ts.smtpConfig }}</div>
				<div class="main">
					<FormInput v-model="smtpHost">
						<span>{{ $ts.smtpHost }}</span>
					</FormInput>
					<FormInput v-model="smtpPort" type="number">
						<span>{{ $ts.smtpPort }}</span>
					</FormInput>
					<FormInput v-model="smtpUser">
						<span>{{ $ts.smtpUser }}</span>
					</FormInput>
					<FormInput v-model="smtpPass" type="password">
						<span>{{ $ts.smtpPass }}</span>
					</FormInput>
					<FormInfo>{{ $ts.emptyToDisableSmtpAuth }}</FormInfo>
					<FormSwitch v-model="smtpSecure">{{ $ts.smtpSecure }}<template #desc>{{ $ts.smtpSecureInfo }}</template></FormSwitch>
				</div>
			</div>

			<FormButton @click="testEmail">{{ $ts.testEmail }}</FormButton>
		</template>

		<FormButton primary @click="save"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/debobigego/switch.vue';
import FormInput from '@/components/debobigego/input.vue';
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
				icon: 'fas fa-envelope',
				bg: 'var(--bg)',
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
			const { canceled, result: destination } = await os.inputText({
				title: this.$ts.destination,
				type: 'email',
				placeholder: this.$instance.maintainerEmail
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
