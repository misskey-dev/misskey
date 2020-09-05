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
import MkButton from '../../components/ui/button.vue';

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
			const { canceled: canceled1, result: currentPassword } = await this.$root.showDialog({
				title: this.$t('currentPassword'),
				input: {
					type: 'password'
				}
			});
			if (canceled1) return;

			const { canceled: canceled2, result: newPassword } = await this.$root.showDialog({
				title: this.$t('newPassword'),
				input: {
					type: 'password'
				}
			});
			if (canceled2) return;

			const { canceled: canceled3, result: newPassword2 } = await this.$root.showDialog({
				title: this.$t('newPasswordRetype'),
				input: {
					type: 'password'
				}
			});
			if (canceled3) return;

			if (newPassword !== newPassword2) {
				this.$root.showDialog({
					type: 'error',
					text: this.$t('retypedNotMatch')
				});
				return;
			}

			const dialog = this.$root.showDialog({
				type: 'waiting',
				iconOnly: true
			});
			
			this.$root.api('i/change-password', {
				currentPassword,
				newPassword
			}).then(() => {
				this.$root.showDialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				this.$root.showDialog({
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
