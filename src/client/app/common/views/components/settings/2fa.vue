<template>
<div class="2fa">
	<p style="margin-top:0;">{{ $t('intro') }}<a :href="$t('url')" target="_blank">{{ $t('detail') }}</a></p>
	<ui-info warn>{{ $t('caution') }}</ui-info>
	<p v-if="!data && !$store.state.i.twoFactorEnabled"><ui-button @click="register">{{ $t('register') }}</ui-button></p>
	<template v-if="$store.state.i.twoFactorEnabled">
		<p>{{ $t('already-registered') }}</p>
		<ui-button @click="unregister">{{ $t('unregister') }}</ui-button>
	</template>
	<div v-if="data && !$store.state.i.twoFactorEnabled">
		<ol>
			<li>{{ $t('authenticator') }}<a href="https://support.google.com/accounts/answer/1066447" target="_blank">{{ $t('howtoinstall') }}</a></li>
			<li>{{ $t('scan') }}<br><img :src="data.qr"></li>
			<li>{{ $t('done') }}<br>
				<ui-input v-model="token">{{ $t('token') }}</ui-input>
				<ui-button primary @click="submit">{{ $t('submit') }}</ui-button>
			</li>
		</ol>
		<ui-info>{{ $t('info') }}</ui-info>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/settings.2fa.vue'),
	data() {
		return {
			data: null,
			token: null
		};
	},
	methods: {
		register() {
			this.$root.dialog({
				title: this.$t('enter-password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				this.$root.api('i/2fa/register', {
					password: password
				}).then(data => {
					this.data = data;
				});
			});
		},

		unregister() {
			this.$root.dialog({
				title: this.$t('enter-password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				this.$root.api('i/2fa/unregister', {
					password: password
				}).then(() => {
					this.$notify(this.$t('unregistered'));
					this.$store.state.i.twoFactorEnabled = false;
				});
			});
		},

		submit() {
			this.$root.api('i/2fa/done', {
				token: this.token
			}).then(() => {
				this.$notify(this.$t('success'));
				this.$store.state.i.twoFactorEnabled = true;
			}).catch(() => {
				this.$notify(this.$t('failed'));
			});
		}
	}
});
</script>
