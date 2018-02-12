<template>
<div>
	<button @click="reset" class="ui primary">%i18n:desktop.tags.mk-password-setting.reset%</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import passwordDialog from '../../scripts/password-dialog';
import dialog from '../../scripts/dialog';
import notify from '../../scripts/notify';

export default Vue.extend({
	methods: {
		reset() {
			passwordDialog('%i18n:desktop.tags.mk-password-setting.enter-current-password%', currentPassword => {
				passwordDialog('%i18n:desktop.tags.mk-password-setting.enter-new-password%', newPassword => {
					passwordDialog('%i18n:desktop.tags.mk-password-setting.enter-new-password-again%', newPassword2 => {
						if (newPassword !== newPassword2) {
							dialog(null, '%i18n:desktop.tags.mk-password-setting.not-match%', [{
								text: 'OK'
							}]);
							return;
						}
						this.$root.$data.os.api('i/change_password', {
							current_password: currentPassword,
							new_password: newPassword
						}).then(() => {
							notify('%i18n:desktop.tags.mk-password-setting.changed%');
						});
					});
				});
			});
		}
	}
});
</script>
