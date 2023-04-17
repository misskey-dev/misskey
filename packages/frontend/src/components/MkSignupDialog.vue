<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="600"
	@close="dialog.close()"
	@closed="$emit('closed')"
>
	<template #header>{{ i18n.ts.signup }}</template>

	<MkSpacer :margin-min="20" :margin-max="28">
		<XServerRules v-if="!isAcceptedServerRule" @accept="isAcceptedServerRule = true"/>
		<XSignup v-else :auto-set="autoSet" @signup="onSignup" @signup-email-pending="onSignupEmailPending"/>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { $ref } from 'vue/macros';
import XSignup from '@/components/MkSignup.vue';
import XServerRules from '@/components/MkSignupServerRules.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n';
import { instance } from '@/instance';

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

const isAcceptedServerRule = $ref(false);

function onSignup(res) {
	emit('done', res);
	dialog.close();
}

function onSignupEmailPending() {
	dialog.close();
}
</script>
