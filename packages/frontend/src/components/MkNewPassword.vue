<template>
<MkInput v-model="password" :debounce="true" type="password" autocomplete="new-password" required data-cy-signup-password @update:modelValue="onChangePassword">
	<template #label>
		{{ label }} <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="nofollow noopener"><span :class="$style.hibpLogo">leak checked by <span>';--hibp?</span></span></a>
	</template>
	<template #prefix><i class="ti ti-lock"></i></template>
	<template #caption>
		<span v-if="passwordStrength == 'wait'" style="color:#999"><MkLoading :em="true"/> {{ i18n.ts.checking }}</span>
		<span v-if="passwordStrength == 'low' && isLeaked" style="color: var(--error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.tsx.leakedPassword({ n: leakedCount }) }}</span>
		<span v-else-if="passwordStrength == 'low'" style="color: var(--error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.weakPassword }}</span>
		<span v-if="passwordStrength == 'medium'" style="color: var(--warn)"><i class="ti ti-check ti-fw"></i> {{ i18n.ts.normalPassword }}</span>
		<span v-if="passwordStrength == 'high'" style="color: var(--success)"><i class="ti ti-check ti-fw"></i> {{ i18n.ts.strongPassword }}</span>
	</template>
</MkInput>
<MkInput v-model="retypedPassword" type="password" autocomplete="new-password" required data-cy-signup-password-retype @update:modelValue="onChangePasswordRetype">
	<template #label>{{ label }} ({{ i18n.ts.retype }})</template>
	<template #prefix><i class="ti ti-lock"></i></template>
	<template #caption>
		<span v-if="passwordRetypeState == 'match'" style="color: var(--success)"><i class="ti ti-check ti-fw"></i> {{ i18n.ts.passwordMatched }}</span>
		<span v-if="passwordRetypeState == 'not-match'" style="color: var(--error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.passwordNotMatched }}</span>
	</template>
</MkInput>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';

defineProps<{
	label: string;
}>();

const password = ref<string>('');
const retypedPassword = ref<string>('');
const passwordStrength = ref<'' | 'wait' | 'low' | 'medium' | 'high'>('');
const isLeaked = ref(false);
const leakedCount = ref(0);
const passwordRetypeState = ref<null | 'match' | 'not-match'>(null);
const passwordAbortController = ref<null | AbortController>(null);

const isValid = computed((): boolean => {
	return passwordRetypeState.value === 'match'
		&& (passwordStrength.value === 'medium' || passwordStrength.value === 'high');
});

defineExpose({
	isValid,
	password,
});

async function getPasswordStrength(source: string): Promise<number> {
	let strength = 0;
	let power = 0.018;

	// 英数字
	if (/[a-zA-Z]/.test(source) && /[0-9]/.test(source)) {
		power += 0.020;
	}

	// 大文字と小文字が混ざってたら
	if (/[a-z]/.test(source) && /[A-Z]/.test(source)) {
		power += 0.015;
	}

	// 記号が混ざってたら
	if (/[!\x22\#$%&@'()*+,-./_]/.test(source)) {
		power += 0.02;
	}

	strength = power * source.length;

	// check HIBP 3 chars or more
	if (passwordAbortController.value != null) {
		passwordAbortController.value.abort();
	}

	if (source.length >= 3) {
		passwordStrength.value = 'wait';
		passwordAbortController.value = new AbortController();

		const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(source));
		const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
		const hashPrefix = hashHex.slice(0, 5).toUpperCase();
		const hashSuffix = hashHex.slice(5).toUpperCase();
		await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, { signal: passwordAbortController.value.signal })
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.text();
			})
			.then(text => {
				const lines = text.split('\n');
				const line = lines.find(l => l.startsWith(hashSuffix));
				if (line) {
					leakedCount.value = parseInt(line.split(':')[1]);
					isLeaked.value = true;
					strength = 0;
				} else {
					isLeaked.value = false;
				}
			})
			.catch(() => {
				leakedCount.value = 0;
				isLeaked.value = false;
			});
	} else {
		leakedCount.value = 0;
		isLeaked.value = false;
	}

	return Math.max(0, Math.min(1, strength));
}

async function onChangePassword(): Promise<void> {
	if (password.value === '') {
		passwordStrength.value = '';
		return;
	}

	const strength = await getPasswordStrength(password.value);
	passwordStrength.value = strength > 0.7 ? 'high' : strength > 0.3 ? 'medium' : 'low';

	onChangePasswordRetype();
}

function onChangePasswordRetype(): void {
	if (retypedPassword.value === '') {
		passwordRetypeState.value = null;
		return;
	}

	passwordRetypeState.value = password.value === retypedPassword.value ? 'match' : 'not-match';
}
</script>

<style lang="scss" module>
.hibpLogo {
	background: linear-gradient(45deg, #616c70, #626262);
	color: #fefefe;
	display: inline-flex;
	padding-left: 8px;
	margin-left: 4px;
	font-size: 0.8em;
	border-radius: 6px;
	overflow: hidden;
	align-items: center;
	transform: translateY(-1px);

	span {
		background: linear-gradient(45deg, #255e81, #338cac);
		font-size: 1.4em;
		padding: 2px 8px;
		height: auto;
		margin-left: 8px;
		font-weight: bold;
	}
}
</style>

