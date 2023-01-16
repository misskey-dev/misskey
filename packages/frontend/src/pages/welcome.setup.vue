<template>
<form class="mk-setup" @submit.prevent="submit()">
	<h1>Welcome to Misskey!</h1>
	<div class="_gaps_m">
		<p>{{ $ts.intro }}</p>
		<MkInput v-model="username" pattern="^[a-zA-Z0-9_]{1,20}$" :spellcheck="false" required data-cy-admin-username>
			<template #label>{{ $ts.username }}</template>
			<template #prefix>@</template>
			<template #suffix>@{{ host }}</template>
		</MkInput>
		<MkInput v-model="password" type="password" data-cy-admin-password>
			<template #label>{{ $ts.password }}</template>
			<template #prefix><i class="ti ti-lock"></i></template>
		</MkInput>
		<div class="bottom">
			<MkButton gradate type="submit" :disabled="submitting" data-cy-admin-ok>
				{{ submitting ? $ts.processing : $ts.done }}<MkEllipsis v-if="submitting"/>
			</MkButton>
		</div>
	</div>
</form>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import { host } from '@/config';
import * as os from '@/os';
import { login } from '@/account';
import { i18n } from '@/i18n';

let username = $ref('');
let password = $ref('');
let submitting = $ref(false);

function submit() {
	if (submitting) return;
	submitting = true;

	os.api('admin/accounts/create', {
		username: username,
		password: password,
	}).then(res => {
		return login(res.token);
	}).catch(() => {
		submitting = false;

		os.alert({
			type: 'error',
			text: i18n.ts.somethingHappened,
		});
	});
}
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

		> .bottom {
			> * {
				margin: 0 auto;
			}
		}
	}
}
</style>
