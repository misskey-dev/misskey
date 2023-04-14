<template>
<div class="_gaps_m">
	<div v-text="i18n.ts._serverRules.beforeSignup"/>
	<ol class="_gaps_m" :class="$style.rule">
		<li v-for="(item, index) in instance.serverRules" :key="index" v-text="item" />
	</ol>
	<div v-text="i18n.ts._serverRules.additionalRules"/>
	<ul style="margin: 0; padding-left: 2em;">
		<li v-if="instance.tosUrl"><a :href="instance.tosUrl" class="_link" target="_blank">{{ i18n.ts.tos }}</a></li>
		<li><a href="https://misskey-hub.net/docs/notes.html" class="_link" target="_blank">{{ i18n.ts.basicNotesBeforeCreateAccount }}</a></li>
	</ul>
	<MkButton primary @click="emit('accept')">{{ i18n.ts.agree }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { instance } from '@/instance';
import { i18n } from "@/i18n";
import MkButton from "@/components/MkButton.vue";

const emit = defineEmits<{
	(ev: 'accept'): void;
}>();

</script>

<style lang="scss" module>
.rule {
	counter-reset: item;
	list-style: none;
	padding: 0;
	margin: 0;
	> li {
		display: flex;
		align-items: center;
		gap: 8px;
		&::before {
			display: flex;
			counter-increment: item;
			content: counter(item);
			width: 40px;
			height: 40px;
			min-width: 40px;
			background-color: var(--accent);
			color: var(--fgOnAccent);
			font-size: 18px;
			align-items: center;
			justify-content: center;
			border-radius: 999px;
		}
	}
}
</style>
