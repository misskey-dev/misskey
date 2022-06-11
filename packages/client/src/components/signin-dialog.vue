<template>
<XModalWindow ref="dialog"
	:width="370"
	:height="400"
	@close="onClose"
	@closed="emit('closed')"
>
	<template #header>{{ $ts.login }}</template>

	<MkSignin :auto-set="autoSet" :message="message" @login="onLogin"/>
</XModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import MkSignin from './signin.vue';

const props = withDefaults(defineProps<{
	autoSet?: boolean;
	message?: string,
}>(), {
	autoSet: false,
	message: ''
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
