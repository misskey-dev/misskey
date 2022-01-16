<template>
<XModalWindow ref="dialog"
	:width="370"
	:height="400"
	@close="dialog.close()"
	@closed="emit('closed')"
>
	<template #header>{{ $ts.login }}</template>

	<MkSignin :auto-set="autoSet" @login="onLogin"/>
</XModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import MkSignin from './signin.vue';

const props = withDefaults(defineProps<{
	autoSet?: boolean;
}>(), {
	autoSet: false,
});

const emit = defineEmits<{
	(e: 'done'): void;
	(e: 'closed'): void;
}>();

const dialog = $ref<InstanceType<typeof XModalWindow>>();

function onLogin(res) {
	emit('done', res);
	dialog.close();
}
</script>
