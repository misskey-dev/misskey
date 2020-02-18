<template>
<x-window @closed="() => { $emit('closed'); destroyDom(); }" :avatar="user">
	<template #header><mk-user-name :user="user"/></template>
	<div class="vrcsvlkm">
		<mk-button @click="resetPassword()" primary>{{ $t('resetPassword') }}</mk-button>
		<mk-switch v-if="$store.state.i.isAdmin && (this.moderator || !user.isAdmin)" @change="toggleModerator()" v-model="moderator">{{ $t('moderator') }}</mk-switch>
		<mk-switch @change="toggleSilence()" v-model="silenced">{{ $t('silence') }}</mk-switch>
		<mk-switch @change="toggleSuspend()" v-model="suspended">{{ $t('suspend') }}</mk-switch>
	</div>
</x-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import MkButton from './ui/button.vue';
import MkSwitch from './ui/switch.vue';
import XWindow from './window.vue';

export default Vue.extend({
	i18n,

	components: {
		MkButton,
		MkSwitch,
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
			moderator: this.user.isModerator,
			silenced: this.user.isSilenced,
			suspended: this.user.isSuspended,
		};
	},

	methods: {
		async resetPassword() {
			const dialog = this.$root.dialog({
				type: 'waiting',
				iconOnly: true
			});

			this.$root.api('admin/reset-password', {
				userId: this.user.id,
			}).then(({ password }) => {
				this.$root.dialog({
					type: 'success',
					text: this.$t('newPasswordIs', { password })
				});
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			}).finally(() => {
				dialog.close();
			});
		},

		async toggleSilence() {
			const confirm = await this.$root.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.silenced ? this.$t('silenceConfirm') : this.$t('unsilenceConfirm'),
			});
			if (confirm.canceled) {
				this.silenced = !this.silenced;
			} else {
				this.$root.api(this.silenced ? 'admin/silence-user' : 'admin/unsilence-user', { userId: this.user.id });
			}
		},

		async toggleSuspend() {
			const confirm = await this.$root.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.suspended ? this.$t('suspendConfirm') : this.$t('unsuspendConfirm'),
			});
			if (confirm.canceled) {
				this.suspended = !this.suspended;
			} else {
				this.$root.api(this.suspended ? 'admin/suspend-user' : 'admin/unsuspend-user', { userId: this.user.id });
			}
		},

		async toggleModerator() {
			this.$root.api(this.moderator ? 'admin/moderators/add' : 'admin/moderators/remove', { userId: this.user.id });
		}
	}
});
</script>

<style lang="scss" scoped>
.vrcsvlkm {

}
</style>
