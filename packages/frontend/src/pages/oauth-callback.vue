<template>
<div>
	<MkAnimBg style="position: fixed; top: 0;"/>
	<div :class="$style.rootContainer">
		<div :class="$style.container" class="_panel">
			<div :class="$style.title">
				<div>{{ i18n.ts.processing }}</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as os from '@/os.js';
import { login } from '@/account.js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkAnimBg from '@/components/MkAnimBg.vue';

let submitting = ref(false);

const props = defineProps<{
	serverId: string;
	code: string;
	state: string;
}>();

function submit() {
	if (submitting.value) return;
	submitting.value = true;

	misskeyApi('oauth-client/callback', {
		serverId: props.serverId,
		code: props.code,
	}).then(res => {
		if (!res || !res.type) {
			os.alert({
				type: 'error',
				text: i18n.ts.somethingHappened,
			});

			return;
		}

		if (res.type === 'verificationEmailSent') {
			os.alert({
				type: 'info',
				text: i18n.ts.verificationEmailSent,
			});

			return;
		}

		if (res.type === 'token') {
			if (!res.signIn) {
				throw new Error('No signIn');
			}

			login(res.signIn.i, '/');

			return;
		}
	}).catch(() => {
		submitting.value = false;

		os.alert({
			type: 'error',
			text: i18n.ts.somethingHappened,
		});
	});
}

submit();
</script>

<style lang="scss" module>
.rootContainer {
	min-height: 100svh;
	padding: 32px 32px 64px 32px;
	box-sizing: border-box;
display: grid;
place-content: center;
}

.container {
	position: relative;
	z-index: 10;
	border-radius: var(--radius);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: clip;
	max-width: 500px;
}

.title {
	margin: 0;
	font-size: 1.5em;
	text-align: center;
	padding: 32px;
	background: var(--accentedBg);
	color: var(--accent);
	font-weight: bold;
}
</style>
