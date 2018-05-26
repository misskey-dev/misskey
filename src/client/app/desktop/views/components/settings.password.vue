<template>
<div>
	<button @click="reset" class="ui primary">%i18n:@reset%</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	methods: {
		reset() {
			(this as any).apis.input({
				title: '%i18n:@enter-current-password%',
				type: 'password'
			}).then(currentPassword => {
				(this as any).apis.input({
					title: '%i18n:@enter-new-password%',
					type: 'password'
				}).then(newPassword => {
					(this as any).apis.input({
						title: '%i18n:@enter-new-password-again%',
						type: 'password'
					}).then(newPassword2 => {
						if (newPassword !== newPassword2) {
							(this as any).apis.dialog({
								title: null,
								text: '%i18n:@not-match%',
								actions: [{
									text: 'OK'
								}]
							});
							return;
						}
						(this as any).api('i/change_password', {
							currentPasword: currentPassword,
							newPassword: newPassword
						}).then(() => {
							(this as any).apis.notify('%i18n:@changed%');
						});
					});
				});
			});
		}
	}
});
</script>
