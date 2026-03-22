<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.header">
		<i class="ti ti-checklist"></i>
		<h3>{{ i18n.ts.pleaseConfirmBelowBeforeSignup }}</h3>
	</div>

	<div :class="$style.content">
		<div v-if="instance.disableRegistration || instance.federation !== 'all'" :class="$style.warnings">
			<MkInfo v-if="instance.disableRegistration" warn>{{ i18n.ts.invitationRequiredToRegister }}</MkInfo>
			<MkInfo v-if="instance.federation === 'specified'" warn>{{ i18n.ts.federationSpecified }}</MkInfo>
			<MkInfo v-else-if="instance.federation === 'none'" warn>{{ i18n.ts.federationDisabled }}</MkInfo>
		</div>

		<!-- Compact server rules -->
		<div v-if="availableServerRules" :class="$style.section">
			<div :class="$style.sectionHeader">
				<h4>{{ i18n.ts.serverRules }}</h4>
				<i v-if="agreeServerRules" class="ti ti-check" :class="$style.checkIcon"></i>
			</div>
			<div :class="$style.rulesPreview">
				<p>{{ i18n.ts.beSureToReadThisAsItIsImportant }}</p>
				<div :class="$style.rulesList">
					<div v-for="(item, index) in instance.serverRules.slice(0, 3)" :key="index" :class="$style.ruleItem">
						{{ index + 1 }}. <span v-html="item"></span>
					</div>
					<div v-if="instance.serverRules.length > 3" :class="$style.moreRules">
						... and {{ instance.serverRules.length - 3 }} more rules
					</div>
				</div>
			</div>
			<MkSwitch :modelValue="agreeServerRules" @update:modelValue="updateAgreeServerRules">{{ i18n.ts.agree }}</MkSwitch>
		</div>

		<!-- Compact ToS/Privacy Policy -->
		<div v-if="availableTos || availablePrivacyPolicy" :class="$style.section">
			<div :class="$style.sectionHeader">
				<h4>{{ tosPrivacyPolicyLabel }}</h4>
				<i v-if="agreeTosAndPrivacyPolicy" class="ti ti-check" :class="$style.checkIcon"></i>
			</div>
			<div :class="$style.linksContainer">
				<a v-if="availableTos" :href="instance.tosUrl ?? undefined" class="_link" target="_blank">
					{{ i18n.ts.termsOfService }} <i class="ti ti-external-link"></i>
				</a>
				<a v-if="availablePrivacyPolicy" :href="instance.privacyPolicyUrl ?? undefined" class="_link" target="_blank">
					{{ i18n.ts.privacyPolicy }} <i class="ti ti-external-link"></i>
				</a>
			</div>
			<MkSwitch :modelValue="agreeTosAndPrivacyPolicy" @update:modelValue="updateAgreeTosAndPrivacyPolicy">{{ i18n.ts.agree }}</MkSwitch>
		</div>

		<!-- Basic notes -->
		<div :class="$style.section">
			<div :class="$style.sectionHeader">
				<h4>{{ i18n.ts.basicNotesBeforeCreateAccount }}</h4>
				<i v-if="agreeNote" class="ti ti-check" :class="$style.checkIcon"></i>
			</div>
			<a href="https://misskey-hub.net/docs/for-users/onboarding/warning/" class="_link" target="_blank">
				{{ i18n.ts.basicNotesBeforeCreateAccount }} <i class="ti ti-external-link"></i>
			</a>
			<MkSwitch :modelValue="agreeNote" @update:modelValue="updateAgreeNote">{{ i18n.ts.agree }}</MkSwitch>
		</div>

		<div v-if="!agreed" :class="$style.agreementNote">
			{{ i18n.ts.pleaseAgreeAllToContinue }}
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';

const availableServerRules = instance.serverRules.length > 0;
const availableTos = instance.tosUrl != null && instance.tosUrl !== '';
const availablePrivacyPolicy = instance.privacyPolicyUrl != null && instance.privacyPolicyUrl !== '';

const agreeServerRules = ref(false);
const agreeTosAndPrivacyPolicy = ref(false);
const agreeNote = ref(false);

const agreed = computed(() => {
	return (!availableServerRules || agreeServerRules.value) && ((!availableTos && !availablePrivacyPolicy) || agreeTosAndPrivacyPolicy.value) && agreeNote.value;
});

const emit = defineEmits<{
	(ev: 'update:agreed', value: boolean): void;
}>();

// Watch for agreement changes and emit to parent
watch(agreed, (newValue) => {
	emit('update:agreed', newValue);
}, { immediate: true });

const tosPrivacyPolicyLabel = computed(() => {
	if (availableTos && availablePrivacyPolicy) {
		return i18n.ts.tosAndPrivacyPolicy;
	} else if (availableTos) {
		return i18n.ts.termsOfService;
	} else if (availablePrivacyPolicy) {
		return i18n.ts.privacyPolicy;
	} else {
		return '';
	}
});

async function updateAgreeServerRules(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts.doYouAgree,
			text: i18n.tsx.iHaveReadXCarefullyAndAgree({ x: i18n.ts.serverRules }),
		});
		if (confirm.canceled) return;
		agreeServerRules.value = true;
	} else {
		agreeServerRules.value = false;
	}
}

async function updateAgreeTosAndPrivacyPolicy(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts.doYouAgree,
			text: i18n.tsx.iHaveReadXCarefullyAndAgree({
				x: tosPrivacyPolicyLabel.value,
			}),
		});
		if (confirm.canceled) return;
		agreeTosAndPrivacyPolicy.value = true;
	} else {
		agreeTosAndPrivacyPolicy.value = false;
	}
}

async function updateAgreeNote(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts.doYouAgree,
			text: i18n.tsx.iHaveReadXCarefullyAndAgree({ x: i18n.ts.basicNotesBeforeCreateAccount }),
		});
		if (confirm.canceled) return;
		agreeNote.value = true;
	} else {
		agreeNote.value = false;
	}
}
</script>

<style lang="scss" module>
.root {
	padding: 16px;
	max-height: 70vh;
	overflow-y: auto;
}

.header {
	text-align: center;
	margin-bottom: 20px;

	i {
		font-size: 24px;
		color: var(--MI_THEME-accent);
		margin-bottom: 8px;
		display: block;
	}

	h3 {
		margin: 0;
		font-size: 16px;
		font-weight: bold;
	}
}

.content {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.warnings {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.section {
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 8px;
	padding: 12px;
	background: var(--MI_THEME-panel);
}

.sectionHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;

	h4 {
		margin: 0;
		font-size: 14px;
		font-weight: bold;
	}
}

.checkIcon {
	color: var(--MI_THEME-success);
	font-size: 18px;
}

.rulesPreview {
	margin-bottom: 12px;

	p {
		margin: 0 0 8px 0;
		font-size: 12px;
		color: var(--MI_THEME-warn);
	}
}

.rulesList {
	background: var(--MI_THEME-bg);
	border-radius: 4px;
	padding: 8px;
	font-size: 12px;
	max-height: 120px;
	overflow-y: auto;
}

.ruleItem {
	margin-bottom: 4px;
	line-height: 1.4;

	&:last-child {
		margin-bottom: 0;
	}
}

.moreRules {
	font-style: italic;
	color: var(--MI_THEME-fg);
	margin-top: 4px;
}

.linksContainer {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 12px;

	a {
		font-size: 14px;
	}
}

.agreementNote {
	text-align: center;
	color: var(--MI_THEME-warn);
	font-size: 14px;
	font-weight: bold;
	padding: 12px;
	background: var(--MI_THEME-warnBg);
	border-radius: 8px;
}
</style>
