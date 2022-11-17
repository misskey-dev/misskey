<template>
<div class="mkmoved _block"><i class="fas fa-info-circle" style="margin-right: 8px;"></i>{{ i18n.ts.accountMoved }}<a class="link" :href="href">{{ acct }}</a></div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n';
import { computed } from 'vue';

const props = defineProps<{
	acct: string;
}>();

const href = $computed(() => `/${props.acct}`);
</script>

<style lang="scss" scoped>
.mkmoved {
	font-size: 0.8em;
	padding: 16px;
	background: var(--infoBg);
	color: var(--infoFg);

	> .link {
		margin-left: 4px;
		color: var(--accent);
	}
}
</style>
