<template>
<form class="mk-setup" @submit.prevent="submit()">
	<h1>Welcome to Misskey!</h1>
	<div>
		<p>{{ $ts.intro }}</p>
		<MkInput v-model="username" pattern="^[a-zA-Z0-9_]{1,20}$" spellcheck="false" required data-cy-admin-username>
			<template #label>{{ $ts.username }}</template>
			<template #prefix>@</template>
			<template #suffix>@{{ host }}</template>
		</MkInput>
		<MkInput v-model="password" type="password" data-cy-admin-password>
			<template #label>{{ $ts.password }}</template>
			<template #prefix><i class="fas fa-lock"></i></template>
		</MkInput>
		<footer>
			<MkButton primary type="submit" :disabled="submitting" data-cy-admin-ok>
				{{ submitting ? $ts.processing : $ts.done }}<MkEllipsis v-if="submitting"/>
			</MkButton>
		</footer>
	</div>
</form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import { host } from '@client/config';
import * as os from '@client/os';
import { login } from '@client/account';

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
				login(res.i);
			}).catch(() => {
				this.submitting = false;

				os.dialog({
					type: 'error',
					text: this.$ts.somethingHappened
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
	max-width: 500px;
	margin: 32px auto;

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
