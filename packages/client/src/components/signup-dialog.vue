<template>
<XModalWindow ref="dialog"
	:width="366"
	:height="500"
	@close="dialog.close()"
	@closed="$emit('closed')"
>
	<template #header>{{ $ts.signup }}</template>

	<div class="_monolithic_">
		<div class="_section">
			<XSignup :auto-set="autoSet" @signup="onSignup" @signupEmailPending="onSignupEmailPending"/>
		</div>
	</div>
</XModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import XSignup from './signup.vue';

const props = withDefaults(defineProps<{
	autoSet?: boolean;
}>(), {
	autoSet: false,
});

const emit = defineEmits<{
	(ev: 'done'): void;
	(ev: 'closed'): void;
}>();

const dialog = $ref<InstanceType<typeof XModalWindow>>();

function onSignup(res) {
	emit('done', res);
	dialog.close();
}

function onSignupEmailPending() {
	dialog.close();
}
</script>
