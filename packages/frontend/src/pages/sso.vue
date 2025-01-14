<template>
	<div>
		<MkAnimBg style="position: fixed; top: 0;"/>
		<div :class="$style.formContainer">
			<div :class="$style.form">
				<MkAuthConfirm
					ref="authRoot"
					:name="name"
					@accept="onAccept"
					@deny="onDeny"
				/>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import MkAnimBg from '@/components/MkAnimBg.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkAuthConfirm from '@/components/MkAuthConfirm.vue';
import { nextTick, onMounted, useTemplateRef } from "vue";
import { $i } from '@/account.js';

const transactionIdMeta = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:transaction-id"]');
if (transactionIdMeta) {
	transactionIdMeta.remove();
}

const name = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:service-name"]')?.content;
const kind = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:kind"]')?.content;
const prompt = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:prompt"]')?.content;

const authRoot = useTemplateRef('authRoot');

async function onAccept(token: string) {
	const result = await fetch(`/sso/${kind}/authorize`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			transaction_id: transactionIdMeta?.content,
			login_token: token,
		}),
	}).then(res => res.json()).catch(() => {
		authRoot.value?.showUI('failed');
	});

	if (!result) return;
	authRoot.value?.showUI('success');

	if (result.binding === 'post') {
		const form = document.createElement('form');
		form.style.display = 'none';
		form.action = result.action;
		form.method = 'post';
		form.acceptCharset = 'utf-8';

		for (const [name, value] of Object.entries(result.context)) {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = name;
			input.value = value as string;
			form.appendChild(input);
		}

		nextTick(() => {
			document.body.appendChild(form);
			form.submit();
		});
	} else {
		location.href = result.action;
	}
}

function onDeny(token: string) {
	authRoot.value?.showUI('denied');
}

onMounted(() => {
	nextTick(() => {
		if ($i && prompt === 'none') {
			onAccept($i.token);
		}
	});
});

definePageMetadata(() => ({
	title: 'Single Sign-On',
	icon: 'ti ti-apps',
}));
</script>

<style lang="scss" module>
.formContainer {
	min-height: 100svh;
	padding: 32px 32px calc(env(safe-area-inset-bottom, 0px) + 32px) 32px;
	box-sizing: border-box;
	display: grid;
	place-content: center;
}

.form {
	position: relative;
	z-index: 10;
	border-radius: var(--radius);
	background-color: var(--panel);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: clip;
	max-width: 500px;
	width: calc(100vw - 64px);
	height: min(65svh, calc(100svh - calc(env(safe-area-inset-bottom, 0px) + 64px)));
	overflow-y: scroll;
}
</style>
