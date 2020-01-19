<template>
<form class="mk-setup" @submit.prevent="submit()">
	<h1>Welcome to Misskey!</h1>
	<div>
		<p>{{ $t('intro') }}</p>
		<x-input v-model="username" pattern="^[a-zA-Z0-9_]{1,20}$" spellcheck="false" required>
			<span>{{ $t('username') }}</span>
			<template #prefix>@</template>
			<template #suffix>@{{ host }}</template>
		</x-input>
		<x-input v-model="password" type="password">
			<span>{{ $t('password') }}</span>
			<template #prefix><fa :icon="faLock"/></template>
		</x-input>
		<footer>
			<x-button primary type="submit" :disabled="submitting">{{ submitting ? $t('processing') : $t('done') }}<mk-ellipsis v-if="submitting"/></x-button>
		</footer>
	</div>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import XButton from '../components/ui/button.vue';
import XInput from '../components/ui/input.vue';
import { host } from '../config';
import i18n from '../i18n';

export default Vue.extend({
	i18n,
	
	components: {
		XButton,
		XInput,
	},

	data() {
		return {
			username: '',
			password: '',
			submitting: false,
			host,
			faLock
		}
	},

	methods: {
		submit() {
			if (this.submitting) return;
			this.submitting = true;

			this.$root.api('admin/accounts/create', {
				username: this.username,
				password: this.password,
			}).then(res => {
				localStorage.setItem('i', res.token);
				location.href = '/';
			}).catch(() => {
				this.submitting = false;

				this.$root.dialog({
					type: 'error',
					text: this.$t('some-error')
				});
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-setup {
	max-width: 470px;
	border-radius: var(--radius);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: hidden;

	> h1 {
		margin: 0;
		font-size: 1.5em;
		text-align: center;
		padding: 32px;
		-webkit-backdrop-filter: blur(8px);
		backdrop-filter: blur(8px);
		color: #fff;
	}

	> div {
		padding: 32px;
		background: var(--panel);

		> p {
			margin-top: 0;
		}

		> footer {
			> * {
				margin: 0 auto;
			}
		}
	}
}
</style>
