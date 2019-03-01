<template>
<div>
	<ui-button @click="reset">{{ $t('reset') }}</ui-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/password-settings.vue'),
	methods: {
		async reset() {
			const { canceled: canceled1, result: currentPassword } = await this.$root.dialog({
				title: this.$t('enter-current-password'),
				input: {
					type: 'password'
				}
			});
			if (canceled1) return;

			const { canceled: canceled2, result: newPassword } = await this.$root.dialog({
				title: this.$t('enter-new-password'),
				input: {
					type: 'password'
				}
			});
			if (canceled2) return;

			const { canceled: canceled3, result: newPassword2 } = await this.$root.dialog({
				title: this.$t('enter-new-password-again'),
				input: {
					type: 'password'
				}
			});
			if (canceled3) return;

			if (newPassword !== newPassword2) {
				this.$root.dialog({
					title: null,
					text: this.$t('not-match')
				});
				return;
			}
			this.$root.api('i/change_password', {
				currentPassword,
				newPassword
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					text: this.$t('changed')
				});
			}).catch(() => {
				this.$root.dialog({
					type: 'error',
					text: this.$t('failed')
				});
			});
		}
	}
});
</script>
