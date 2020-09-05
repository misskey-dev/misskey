<template>
<div class="mk-follow-page">
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	created() {
		const acct = new URL(location.href).searchParams.get('acct');
		if (acct == null) return;

		const dialog = this.$root.showDialog({
			type: 'waiting',
			text: this.$t('fetchingAsApObject') + '...',
			showOkButton: false,
			showCancelButton: false,
			cancelableByBgClick: false
		});

		if (acct.startsWith('https://')) {
			this.$root.api('ap/show', {
				uri: acct
			}).then(res => {
				if (res.type == 'User') {
					this.follow(res.object);
				} else {
					this.$root.showDialog({
						type: 'error',
						text: 'Not a user'
					}).then(() => {
						window.close();
					});
				}
			}).catch(e => {
				this.$root.showDialog({
					type: 'error',
					text: e
				}).then(() => {
					window.close();
				});
			}).finally(() => {
				dialog.close();
			});
		} else {
			this.$root.api('users/show', parseAcct(acct)).then(user => {
				this.follow(user);
			}).catch(e => {
				this.$root.showDialog({
					type: 'error',
					text: e
				}).then(() => {
					window.close();
				});
			}).finally(() => {
				dialog.close();
			});
		}
	},

	methods: {
		async follow(user) {
			const { canceled } = await this.$root.showDialog({
				type: 'question',
				text: this.$t('followConfirm', { name: user.name || user.username }),
				showCancelButton: true
			});

			if (canceled) {
				window.close();
				return;
			}
			
			this.$root.api('following/create', {
				userId: user.id
			}).then(() => {
				this.$root.showDialog({
					type: 'success',
					iconOnly: true, autoClose: true
				}).then(() => {
					window.close();
				});
			}).catch(e => {
				this.$root.showDialog({
					type: 'error',
					text: e
				}).then(() => {
					window.close();
				});
			});
		}
	}
});
</script>
