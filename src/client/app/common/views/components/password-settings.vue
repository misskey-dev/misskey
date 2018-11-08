<template>
<div>
	<ui-button @click="reset">{{ $t('reset') }}</ui-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/password-settings.vue'),
	methods: {
		reset() {
			this.$root.apis.input({
				title: this.$t('enter-current-password'),
				type: 'password'
			}).then(currentPassword => {
				this.$root.apis.input({
					title: this.$t('enter-new-password'),
					type: 'password'
				}).then(newPassword => {
					this.$root.apis.input({
						title: this.$t('enter-new-password-again'),
						type: 'password'
					}).then(newPassword2 => {
						if (newPassword !== newPassword2) {
							this.$root.apis.dialog({
								title: null,
								text: this.$t('not-match'),
								actions: [{
									text: 'OK'
								}]
							});
							return;
						}
						this.$root.api('i/change_password', {
							currentPasword: currentPassword,
							newPassword: newPassword
						}).then(() => {
							this.$root.apis.notify(this.$t('changed'));
						});
					});
				});
			});
		}
	}
});
</script>
