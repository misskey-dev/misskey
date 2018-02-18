<template>
<div class="mk-2fa-setting">
	<p>%i18n:desktop.tags.mk-2fa-setting.intro%<a href="%i18n:desktop.tags.mk-2fa-setting.url%" target="_blank">%i18n:desktop.tags.mk-2fa-setting.detail%</a></p>
	<div class="ui info warn"><p>%fa:exclamation-triangle%%i18n:desktop.tags.mk-2fa-setting.caution%</p></div>
	<p v-if="!data && !I.two_factor_enabled"><button @click="register" class="ui primary">%i18n:desktop.tags.mk-2fa-setting.register%</button></p>
	<template v-if="I.two_factor_enabled">
		<p>%i18n:desktop.tags.mk-2fa-setting.already-registered%</p>
		<button @click="unregister" class="ui">%i18n:desktop.tags.mk-2fa-setting.unregister%</button>
	</template>
	<div v-if="data">
		<ol>
			<li>%i18n:desktop.tags.mk-2fa-setting.authenticator% <a href="https://support.google.com/accounts/answer/1066447" target="_blank">%i18n:desktop.tags.mk-2fa-setting.howtoinstall%</a></li>
			<li>%i18n:desktop.tags.mk-2fa-setting.scan%<br><img src={ data.qr }></li>
			<li>%i18n:desktop.tags.mk-2fa-setting.done%<br>
				<input type="number" v-model="token" class="ui">
				<button @click="submit" class="ui primary">%i18n:desktop.tags.mk-2fa-setting.submit%</button>
			</li>
		</ol>
		<div class="ui info"><p>%fa:info-circle%%i18n:desktop.tags.mk-2fa-setting.info%</p></div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import passwordDialog from '../../scripts/password-dialog';
import notify from '../../scripts/notify';

export default Vue.extend({
	data() {
		return {
			data: null,
			token: null
		};
	},
	methods: {
		register() {
			passwordDialog('%i18n:desktop.tags.mk-2fa-setting.enter-password%', password => {
				(this as any).api('i/2fa/register', {
					password: password
				}).then(data => {
					this.data = data;
				});
			});
		},

		unregister() {
			passwordDialog('%i18n:desktop.tags.mk-2fa-setting.enter-password%', password => {
				(this as any).api('i/2fa/unregister', {
					password: password
				}).then(() => {
					notify('%i18n:desktop.tags.mk-2fa-setting.unregistered%');
					(this as any).os.i.two_factor_enabled = false;
				});
			});
		},

		submit() {
			(this as any).api('i/2fa/done', {
				token: this.token
			}).then(() => {
				notify('%i18n:desktop.tags.mk-2fa-setting.success%');
				(this as any).os.i.two_factor_enabled = true;
			}).catch(() => {
				notify('%i18n:desktop.tags.mk-2fa-setting.failed%');
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-2fa-setting
	color #4a535a

</style>
