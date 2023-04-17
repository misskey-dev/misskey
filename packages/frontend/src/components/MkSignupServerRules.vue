<template>
<div class="_gaps_m">
	<div style="text-align: center;">{{ i18n.ts.pleaseConfirmBelowBeforeSignup }}</div>

	<MkFolder :default-open="true">
		<template #label>{{ i18n.ts.serverRules }}</template>

		<ol class="_gaps_s" :class="$style.rules">
			<li v-for="(item, index) in instance.serverRules" :key="index" :class="$style.rule" v-html="item"></li>
		</ol>

		<MkSwitch v-model="agreeServerRules" style="margin-top: 16px;">{{ i18n.ts.agree }}</MkSwitch>
	</MkFolder>

	<MkFolder v-if="instance.tosUrl">
		<template #label>{{ i18n.ts.termsOfService }}</template>

		<a :href="instance.tosUrl" class="_link" target="_blank">{{ i18n.ts.termsOfService }}</a>

		<MkSwitch v-model="agreeTos" style="margin-top: 16px;">{{ i18n.ts.agree }}</MkSwitch>
	</MkFolder>

	<MkFolder>
		<template #label>{{ i18n.ts.basicNotesBeforeCreateAccount }}</template>

		<a href="https://misskey-hub.net/docs/notes.html" class="_link" target="_blank">{{ i18n.ts.basicNotesBeforeCreateAccount }}</a>

		<MkSwitch v-model="agreeNote" style="margin-top: 16px;">{{ i18n.ts.agree }}</MkSwitch>
	</MkFolder>

	<MkButton primary rounded style="margin: 0 auto;" :disabled="!agreed" @click="emit('accept')">{{ i18n.ts.continue }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { instance } from '@/instance';
import { i18n } from '@/i18n';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';

const agreeServerRules = ref(false);
const agreeTos = ref(false);
const agreeNote = ref(false);

const agreed = computed(() => {
	return agreeServerRules.value && agreeTos.value && agreeNote.value;
});

const emit = defineEmits<{
	(ev: 'accept'): void;
}>();
</script>

<style lang="scss" module>
.rules {
	counter-reset: item;
	list-style: none;
	padding: 0;
	margin: 0;
}

.rule {
	display: flex;
	align-items: center;
	gap: 8px;

	&::before {
		display: flex;
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
</style>
