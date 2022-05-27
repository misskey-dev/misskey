<template>
<div class="mk-follow-page">
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';
import * as Acct from 'misskey-js/built/acct';

export default defineComponent({
	created() {
		const acct = new URL(location.href).searchParams.get('acct');
		if (acct == null) return;

		let promise;

		if (acct.startsWith('https://')) {
			promise = os.api('ap/show', {
				uri: acct
			});
			promise.then(res => {
				if (res.type === 'User') {
					this.follow(res.object);
				} else if (res.type === 'Note') {
					this.$router.push(`/notes/${res.object.id}`);
				} else {
					os.alert({
						type: 'error',
						text: 'Not a user'
					}).then(() => {
						window.close();
					});
				}
			});
		} else {
			promise = os.api('users/show', Acct.parse(acct));
			promise.then(user => {
				this.follow(user);
			});
		}

		os.promiseDialog(promise, null, null, this.$ts.fetchingAsApObject);
	},

	methods: {
		async follow(user) {
			const { canceled } = await os.confirm({
				type: 'question',
				text: this.$t('followConfirm', { name: user.name || user.username }),
			});

			if (canceled) {
				window.close();
				return;
			}
			
			os.apiWithDialog('following/create', {
				userId: user.id
			});
		}
	}
});
</script>
