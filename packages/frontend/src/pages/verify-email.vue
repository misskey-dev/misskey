<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithAnimBg>
	<div :class="$style.formContainer">
		<form :class="$style.form" class="_panel">
			<div :class="$style.banner">
				<i v-if="verified === true" class="ti ti-check"></i>
				<i v-else-if="verified === false" class="ti ti-x"></i>
				<i v-else class="ti ti-mail"></i>
			</div>
			<div class="_gaps_m" style="padding: 32px;">
				<!-- Success state -->
				<div v-if="verified === true">
					<div :class="$style.title">{{ i18n.ts.emailVerified }}</div>
					<div>{{ i18n.ts.emailVerifiedDescription }}</div>
					<div>
						<MkButton gradate large rounded @click="goToLogin" style="margin: 0 auto;">
							{{ i18n.ts.gotIt }}
						</MkButton>
					</div>
				</div>
				<!-- Error state -->
				<div v-else-if="verified === false">
					<div :class="$style.title">{{ i18n.ts.emailVerificationFailed }}</div>
					<div>{{ i18n.ts.emailVerificationFailedDescription }}</div>
					<div>
						<MkButton gradate large rounded @click="goHome" style="margin: 0 auto;">
							{{ i18n.ts.gotIt }}
						</MkButton>
					</div>
				</div>
				<!-- Loading state -->
				<div v-else>
					<div :class="$style.title">{{ i18n.ts.loading }}</div>
					<MkLoading/>
				</div>
			</div>
		</form>
		<!-- Instance branding -->
		<div :class="$style.branding">
			<div :class="$style.poweredBy">Powered by</div>
			<img :src="misskeysvg" :class="$style.misskey"/>
		</div>
	</div>
</PageWithAnimBg>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkLoading from '@/components/MkLoading.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { mainRouter } from '@/router.js';
import misskeysvg from '/client-assets/misskey.svg';

const verified = ref<boolean | null>(null);

const props = defineProps<{
	code: string;
}>();

onMounted(async () => {
	try {
		await misskeyApi('verify-email', {
			code: props.code,
		});
		verified.value = true;
	} catch (err) {
		verified.value = false;
		console.error(err);
	}
});

function goToLogin() {
	mainRouter.push('/');
}

function goHome() {
	mainRouter.push('/');
}
</script>

<style lang="scss" module>
.formContainer {
	min-height: 100svh;
	padding: 32px 32px 64px 32px;
	box-sizing: border-box;
	display: grid;
	place-content: center;
	position: relative;
}

.form {
	position: relative;
	z-index: 10;
	border-radius: var(--MI-radius);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: clip;
	max-width: 500px;
}

.banner {
	padding: 16px;
	text-align: center;
	font-size: 26px;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.title {
	font-size: 1.2em;
	font-weight: bold;
	text-align: center;
	margin-bottom: 16px;
}

.branding {
	position: fixed;
	bottom: 32px;
	left: 32px;
	color: #fff;
	user-select: none;
	pointer-events: none;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.poweredBy {
	margin-bottom: 2px;
	font-size: 0.9em;
	opacity: 0.8;
}

.misskey {
	width: 120px;

	@media (max-width: 450px) {
		width: 100px;
	}
}
</style>