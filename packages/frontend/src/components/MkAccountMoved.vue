<template>
<div v-if="user" :class="$style.root">
	<i class="ti ti-plane-departure" style="margin-right: 8px;"></i>
	{{ i18n.ts.accountMoved }}
	<MkMention :class="$style.link" :username="user.username" :host="user.host ?? localHost"/>
</div>
</template>

<script lang="ts" setup>
import MkMention from './MkMention.vue';
import { i18n } from '@/i18n';
import { host as localHost } from '@/config';
import { ref } from 'vue';
import { UserLite } from 'misskey-js/built/entities';
import { api } from '@/os';

const user = ref<UserLite>();

const props = defineProps<{
	movedTo: string; // user id
}>();

api('users/show', { userId: props.movedTo }).then(u => user.value = u);
</script>

<style lang="scss" module>
.root {
	padding: 16px;
	font-size: 90%;
	background: var(--infoWarnBg);
	color: var(--error);
	border-radius: var(--radius);
}

.link {
	margin-left: 4px;
}
</style>
