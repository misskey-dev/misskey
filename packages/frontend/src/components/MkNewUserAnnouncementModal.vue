<template>
<MkModal ref="modal" :zPriority="'middle'" @click="$refs.modal.close()" @closed="$emit('closed')">
	<div :class="$style.root">
		<div :class="$style.title">{{ i18n.ts.newUserAnnouncementAvailable }}</div>
		<MkButton :class="$style.gotIt" primary full :disabled="gotItDisabled" @click="gotIt">{{ i18n.ts.gotIt }}</MkButton>
	</div>
</MkModal>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';
import { api } from '@/os';
const router = useRouter();
const modal = shallowRef<InstanceType<typeof MkModal>>();

const props = defineProps<{
	title: string;
	text: string;
	announcementId: string;
}>();

async function gotIt() {
	await api('i/read-announcement', { announcementId: props.announcementId });
}
 
function jumpTo() {
	modal.value.close();
	router.push('/announcements');
}
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
}

.title {
	font-weight: bold;
}

.version {
	margin: 1em 0;
}

.gotIt {
	margin: 8px 0 0 0;
}
</style>
