<template>
<MkModal ref="modal" :zPriority="'middle'" @click="closeModal" @closed="$emit('closed')">
	<div :class="$style.root">
		<div :class="$style.title"><Mfm :text="props.title"/></div>
		<div :class="$style.text">
			<Mfm :text="props.text"/>
		</div>
		<MkButton :class="$style.gotIt" primary full :disabled="gotItDisabled" @click="gotIt">{{ i18n.ts.gotIt }}<span v-if="secVisible">({{ sec }})</span></MkButton>
	</div>
</MkModal>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';
import { api } from '@/os';

const modal = shallowRef<InstanceType<typeof MkModal>>();
const gotItDisabled = ref(true);
const secVisible = ref(true);

const props = defineProps<{
	title: string;
	text: string;
	announcementId: string | null;
	closeDuration: number;
}>();

const sec = ref(props.closeDuration);

async function gotIt() {
	gotItDisabled.value = true;
	if (props.announcementId) {
		await api('i/read-announcement', { announcementId: props.announcementId });
	}
	modal.value.close();
}

function closeModal() {
	if (sec.value === 0) {
		modal.value.close();
	}
}

onMounted(() => {
	if (sec.value > 0 ) {
		const waitTimer = setInterval(() => {
			if (sec.value === 0) {
				clearInterval(waitTimer);
				gotItDisabled.value = false;
				secVisible.value = false;
			} else {
				gotItDisabled.value = true;
			}
			sec.value = sec.value - 1;
		}, 1000);
	} else {
		gotItDisabled.value = false;
		secVisible.value = false;
	}
});
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

.text {
	margin: 1em 0;
}

.gotIt {
	margin: 8px 0 0 0;
}
</style>
