<template>
<section class="_card">
	<div class="_title"><fa :icon="faLock"/> {{ $t('password') }}</div>
	<div class="_content">
		<mk-button primary @click="change()">{{ $t('changePassword') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
	},
	
	data() {
		return {
			faLock
		}
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

			const dialog = os.dialog({
				type: 'waiting',
				iconOnly: true
			});
			
			os.api('i/change-password', {
				currentPassword,
				newPassword
			}).then(() => {
				os.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				os.dialog({
					type: 'error',
					text: e
				});
			}).finally(() => {
				dialog.close();
			});
		}
	}
});
</script>
