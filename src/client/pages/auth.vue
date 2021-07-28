<template>
<div class="" v-if="$i && fetching">
	<MkLoading/>
</div>
<div v-else-if="$i">
	<XForm
		class="form"
		ref="form"
		v-if="state == 'waiting'"
		:session="session"
		@denied="state = 'denied'"
		@accepted="accepted"
	/>
	<div class="denied" v-if="state == 'denied'">
		<h1>{{ $ts._auth.denied }}</h1>
	</div>
	<div class="accepted" v-if="state == 'accepted'">
		<h1>{{ session.app.isAuthorized ? this.$t('already-authorized') : this.$ts.allowed }}</h1>
		<p v-if="session.app.callbackUrl">{{ $ts._auth.callback }}<MkEllipsis/></p>
		<p v-if="!session.app.callbackUrl">{{ $ts._auth.pleaseGoBack }}</p>
	</div>
	<div class="error" v-if="state == 'fetch-session-error'">
		<p>{{ $ts.somethingHappened }}</p>
	</div>
</div>
<div class="signin" v-else>
	<MkSignin @login="onLogin"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XForm from './auth.form.vue';
import MkSignin from '@client/components/signin.vue';
import * as os from '@client/os';
import { login } from '@client/account';

export default defineComponent({
	components: {
		XForm,
		MkSignin,
	},
	data() {
		return {
			state: null,
			session: null,
			fetching: true
		};
	},
	computed: {
		token(): string {
			return this.$route.params.token;
		}
	},
	mounted() {
		if (!this.$i) return;

		// Fetch session
		os.api('auth/session/show', {
			token: this.token
		}).then(session => {
			this.session = session;
			this.fetching = false;

			// 既に連携していた場合
			if (this.session.app.isAuthorized) {
				os.api('auth/accept', {
					token: this.session.token
				}).then(() => {
					this.accepted();
				});
			} else {
				this.state = 'waiting';
			}
		}).catch(error => {
			this.state = 'fetch-session-error';
			this.fetching = false;
		});
	},
	methods: {
		accepted() {
			this.state = 'accepted';
			if (this.session.app.callbackUrl) {
				location.href = `${this.session.app.callbackUrl}?token=${this.session.token}`;
			}
		}, onLogin(res) {
			login(res.i);
		}
	}
});
</script>

<style lang="scss" scoped>

</style>
