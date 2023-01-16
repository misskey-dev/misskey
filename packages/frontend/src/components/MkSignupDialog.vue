<template>
<MkModalWindow
	ref="dialog"
	:width="366"
	:height="500"
	@close="dialog.close()"
	@closed="$emit('closed')"
>
	<template #header>{{ i18n.ts.signup }}</template>

	<MkSpacer :margin-min="20" :margin-max="28">
		<XSignup :auto-set="autoSet" @signup="onSignup" @signup-email-pending="onSignupEmailPending"/>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XSignup from '@/components/MkSignup.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	autoSet?: boolean;
}>(), {
	autoSet: false,
});

const emit = defineEmits<{
	(ev: 'done'): void;
	(ev: 'closed'): void;
}>();

const dialog = $shallowRef<InstanceType<typeof MkModalWindow>>();

function onSignup(res) {
	emit('done', res);
	dialog.close();
}

function onSignupEmailPending() {
	dialog.close();
}
</script>
