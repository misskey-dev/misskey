<template>
<div>
	<div class="_section">
		<X2fa/>
	</div>
	<div class="_section">
		<MkButton primary @click="change()" full>{{ $t('changePassword') }}</MkButton>
	</div>
	<div class="_section">
		<MkButton class="_vMargin" primary @click="regenerateToken" full><Fa :icon="faSyncAlt"/> {{ $t('regenerateLoginToken') }}</MkButton>
		<div class="_caption _vMargin" style="padding: 0 6px;">{{ $t('regenerateLoginTokenDescription') }}</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLock, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import X2fa from './security.2fa.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		X2fa,
	},
	
	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$t('security'),
				icon: faLock
			},
			faLock, faSyncAlt
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		async change() {
			const { canceled: canceled1, result: currentPassword } = await os.dialog({
				title: this.$t('currentPassword'),
				input: {
					type: 'password'
				}
			});
			if (canceled1) return;

			const { canceled: canceled2, result: newPassword } = await os.dialog({
				title: this.$t('newPassword'),
				input: {
					type: 'password'
				}
			});
			if (canceled2) return;

			const { canceled: canceled3, result: newPassword2 } = await os.dialog({
				title: this.$t('newPasswordRetype'),
				input: {
					type: 'password'
				}
			});
			if (canceled3) return;

			if (newPassword !== newPassword2) {
				os.dialog({
					type: 'error',
					text: this.$t('retypedNotMatch')
				});
				return;
			}
			
			os.apiWithDialog('i/change-password', {
				currentPassword,
				newPassword
			});
		},

		regenerateToken() {
			os.dialog({
				title: this.$t('password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.api('i/regenerate_token', {
					password: password
				});
			});
		},
	}
});
</script>
