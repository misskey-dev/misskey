<template>
<MkModal
	ref="dialogEl"
	@click="emit('cancel')"
	@close="emit('cancel')"
	@closed="emit('closed')"
>
	<div :clas="$style.root">
		<p v-text="i18n.ts._2fa.step2" />
		<img :src="twoFactorData.qr">
		<p v-text="i18n.ts._2fa.step2Url" />
		<pre><code v-text="twoFactorData.url" /></pre>
		<MkButton primary @click="emit('ok')">{{ i18n.ts.next }}</MkButton>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import MkButton from '@/components/MkButton.vue';
import MkModal from '@/components/MkModal.vue';
import { i18n } from '@/i18n';

defineProps<{
	twoFactorData: {
		qr: string;
		url: string;
	};
}>();

const emit = defineEmits<{
	(ev: 'ok'): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();
</script>

<style lang="scss" module>
.root {
	text-align: center;
}
</style>
