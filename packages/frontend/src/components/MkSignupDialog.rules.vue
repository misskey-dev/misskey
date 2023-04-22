<template>
<div>
	<div :class="$style.banner">
		<i class="ti ti-checklist"></i>
	</div>
	<MkSpacer :margin-min="20" :margin-max="28">
		<div class="_gaps_m">
			<div v-if="instance.disableRegistration">
				<MkInfo warn>{{ i18n.ts.invitationRequiredToRegister }}</MkInfo>
			</div>

			<div style="text-align: center;">{{ i18n.ts.pleaseConfirmBelowBeforeSignup }}</div>

			<MkFolder v-if="availableServerRules" :default-open="true">
				<template #label>{{ i18n.ts.serverRules }}</template>
				<template #suffix><i v-if="agreeServerRules" class="ti ti-check" style="color: var(--success)"></i></template>

				<ol class="_gaps_s" :class="$style.rules">
					<li v-for="item in instance.serverRules" :class="$style.rule"><div :class="$style.ruleText" v-html="item"></div></li>
				</ol>

				<MkSwitch v-model="agreeServerRules" style="margin-top: 16px;">{{ i18n.ts.agree }}</MkSwitch>
			</MkFolder>

			<MkFolder v-if="availableTos" :default-open="true">
				<template #label>{{ i18n.ts.termsOfService }}</template>
				<template #suffix><i v-if="agreeTos" class="ti ti-check" style="color: var(--success)"></i></template>

				<a :href="instance.tosUrl" class="_link" target="_blank">{{ i18n.ts.termsOfService }} <i class="ti ti-external-link"></i></a>

				<MkSwitch v-model="agreeTos" style="margin-top: 16px;">{{ i18n.ts.agree }}</MkSwitch>
			</MkFolder>

			<MkFolder :default-open="true">
				<template #label>{{ i18n.ts.basicNotesBeforeCreateAccount }}</template>
				<template #suffix><i v-if="agreeNote" class="ti ti-check" style="color: var(--success)"></i></template>

				<a href="https://misskey-hub.net/docs/notes.html" class="_link" target="_blank">{{ i18n.ts.basicNotesBeforeCreateAccount }} <i class="ti ti-external-link"></i></a>

				<MkSwitch v-model="agreeNote" style="margin-top: 16px;" data-cy-signup-rules-notes-agree>{{ i18n.ts.agree }}</MkSwitch>
			</MkFolder>

			<div v-if="!agreed" style="text-align: center;">{{ i18n.ts.pleaseAgreeAllToContinue }}</div>

			<div class="_buttonsCenter">
				<MkButton inline rounded @click="emit('cancel')">{{ i18n.ts.cancel }}</MkButton>
				<MkButton inline primary rounded gradate :disabled="!agreed" data-cy-signup-rules-continue @click="emit('done')">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
			</div>
		</div>
	</MkSpacer>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { instance } from '@/instance';
import { i18n } from '@/i18n';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';

const availableServerRules = instance.serverRules.length > 0;
const availableTos = instance.tosUrl != null;

const agreeServerRules = ref(false);
const agreeTos = ref(false);
const agreeNote = ref(false);

const agreed = computed(() => {
	return (!availableServerRules || agreeServerRules.value) && (!availableTos || agreeTos.value) && agreeNote.value;
});

const emit = defineEmits<{
	(ev: 'cancel'): void;
	(ev: 'done'): void;
}>();
</script>

<style lang="scss" module>
.banner {
	padding: 16px;
	text-align: center;
	font-size: 26px;
	background-color: var(--accentedBg);
	color: var(--accent);
}

.rules {
	counter-reset: item;
	list-style: none;
	padding: 0;
	margin: 0;
}

.rule {
	display: flex;
	gap: 8px;
	word-break: break-word;

	&::before {
		flex-shrink: 0;
		display: flex;
		position: sticky;
		top: calc(var(--stickyTop, 0px) + 8px);
		counter-increment: item;
		content: counter(item);
		width: 32px;
		height: 32px;
		line-height: 32px;
		background-color: var(--accentedBg);
		color: var(--accent);
		font-size: 13px;
		font-weight: bold;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
	}
}

.ruleText {
	padding-top: 6px;
}
</style>
