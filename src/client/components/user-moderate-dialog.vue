<template>
<x-window @closed="() => { $emit('closed'); destroyDom(); }" :avatar="user">
	<template #header><mk-user-name :user="user"/></template>
	<div class="vrcsvlkm">
		<x-button @click="changePassword()">{{ $t('changePassword') }}</x-button>
	</div>
</x-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import XButton from './ui/button.vue';
import XWindow from './window.vue';

export default Vue.extend({
	i18n,

	components: {
		XButton,
		XWindow,
	},

	props: {
		user: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
		};
	},

	methods: {
		async changePassword() {
			const { canceled: canceled, result: newPassword } = await this.$root.dialog({
				title: this.$t('newPassword'),
				input: {
					type: 'password'
				}
			});
			if (canceled) return;

			const dialog = this.$root.dialog({
				type: 'waiting',
				iconOnly: true
			});
			
			this.$root.api('admin/change-password', {
				userId: this.user.id,
				newPassword
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				this.$root.dialog({
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

<style lang="scss" scoped>
@import '../theme';

.vrcsvlkm {

}
</style>
