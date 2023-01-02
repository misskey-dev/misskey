<template>
<XModalWindow
	ref="dialog"
	:width="370"
	:height="400"
	@close="onClose"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.login }}</template>

	<MkSignin :auto-set="autoSet" :message="message" @login="onLogin"/>
</XModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkSignin from '@/components/MkSignin.vue';
import XModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	autoSet?: boolean;
	message?: string,
}>(), {
	autoSet: false,
	message: '',
});

const emit = defineEmits<{
	(ev: 'done'): void;
	(ev: 'closed'): void;
	(ev: 'cancelled'): void;
}>();

const dialog = $ref<InstanceType<typeof XModalWindow>>();

function onClose() {
	emit('cancelled');
	dialog.close();
}

function onLogin(res) {
	emit('done', res);
	dialog.close();
}
</script>
