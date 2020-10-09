<template>
<form class="mk-setup" @submit.prevent="submit()">
	<h1>Welcome to Misskey!</h1>
	<div>
		<p>{{ $t('intro') }}</p>
		<MkInput v-model:value="username" pattern="^[a-zA-Z0-9_]{1,20}$" spellcheck="false" required>
			<span>{{ $t('username') }}</span>
			<template #prefix>@</template>
			<template #suffix>@{{ host }}</template>
		</MkInput>
		<MkInput v-model:value="password" type="password">
			<span>{{ $t('password') }}</span>
			<template #prefix><Fa :icon="faLock"/></template>
		</MkInput>
		<footer>
			<MkButton primary type="submit" :disabled="submitting">{{ submitting ? $t('processing') : $t('done') }}<MkEllipsis v-if="submitting"/></MkButton>
		</footer>
	</div>
</form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import { host } from '@/config';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
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

			os.api('admin/accounts/create', {
				username: this.username,
				password: this.password,
			}).then(res => {
				localStorage.setItem('i', res.token);
				location.href = '/';
			}).catch(() => {
				this.submitting = false;

				os.dialog({
					type: 'error',
					text: this.$t('error')
				});
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-setup {
	border-radius: var(--radius);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: hidden;

	> h1 {
		margin: 0;
		font-size: 1.5em;
		text-align: center;
		padding: 32px;
		background: var(--accent);
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
