<template>
<MkModalWindow
	ref="dialog"
	:width="370"
	:height="400"
	@close="onClose"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.login }}</template>

	<MkSpacer :margin-min="20" :margin-max="28">
		<MkSignin :auto-set="autoSet" :message="message" @login="onLogin"/>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkSignin from '@/components/MkSignin.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
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

const dialog = $shallowRef<InstanceType<typeof MkModalWindow>>();

function onClose() {
	emit('cancelled');
	dialog.close();
}

function onLogin(res) {
	emit('done', res);
	dialog.close();
}
</script>
