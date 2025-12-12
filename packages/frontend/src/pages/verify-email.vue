<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithAnimBg>
	<div :class="$style.formContainer">
		<form :class="$style.form" class="_panel" @submit.prevent="submit()">
			<div :class="$style.banner">
				<i class="ti ti-mail-check"></i>
			</div>
			<Transition
				mode="out-in"
				:enterActiveClass="$style.transition_enterActive"
				:leaveActiveClass="$style.transition_leaveActive"
				:enterFromClass="$style.transition_enterFrom"
				:leaveToClass="$style.transition_leaveTo"
			>
				<div v-if="!succeeded" key="input" class="_gaps_m" style="padding: 32px;">
					<div :class="$style.mainText">{{ i18n.tsx.clickToFinishEmailVerification({ ok: i18n.ts.gotIt }) }}</div>
					<div>
						<MkButton gradate large rounded type="submit" :disabled="submitting" style="margin: 0 auto;">
							{{ submitting ? i18n.ts.processing : i18n.ts.gotIt }}<MkEllipsis v-if="submitting"/>
						</MkButton>
					</div>
				</div>
				<div v-else key="success" class="_gaps_m" style="padding: 32px;">
					<div :class="$style.mainText">{{ i18n.ts.emailVerified }}</div>
					<div>
						<MkButton large rounded link to="/" linkBehavior="browser" style="margin: 0 auto;">
							{{ i18n.ts.goToMisskey }}
						</MkButton>
					</div>
				</div>
			</Transition>
		</form>
	</div>
</PageWithAnimBg>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';

const submitting = ref(false);
const succeeded = ref(false);

const props = defineProps<{
	code: string;
}>();

function submit() {
	if (submitting.value) return;
	submitting.value = true;

	misskeyApi('verify-email', {
		code: props.code,
	}).then(() => {
		succeeded.value = true;
		submitting.value = false;
	}).catch(() => {
		submitting.value = false;

		os.alert({
			type: 'error',
			title: i18n.ts.somethingHappened,
			text: i18n.ts.emailVerificationFailedError,
		});
	});
}
</script>

<style lang="scss" module>
.transition_enterActive,
.transition_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.formContainer {
	min-height: 100svh;
	padding: 32px 32px 64px 32px;
	box-sizing: border-box;
	display: flex;
	align-items: center;
}

.form {
	position: relative;
	display: block;
	margin: 0 auto;
	z-index: 10;
	border-radius: var(--MI-radius);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: clip;
	width: 100%;
	max-width: 500px;
}

.banner {
	padding: 16px;
	text-align: center;
	font-size: 26px;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.mainText {
	text-align: center;
}
</style>
