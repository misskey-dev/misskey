<template>
<MkSpacer v-if="token" :content-max="700" :margin-min="16" :margin-max="32">
	<div class="_formRoot">
		<FormInput v-model="password" type="password" class="_formBlock">
			<template #prefix><i class="fas fa-lock"></i></template>
			<template #label>{{ i18n.ts.newPassword }}</template>
		</FormInput>
		
		<FormButton primary class="_formBlock" @click="save">{{ i18n.ts.save }}</FormButton>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onMounted } from 'vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';
import { router } from '@/router';

const props = defineProps<{
	token?: string;
}>();

let password = $ref('');

async function save() {
	await os.apiWithDialog('reset-password', {
		token: props.token,
		password: password,
	});
	router.push('/');
}

onMounted(() => {
	if (props.token == null) {
		os.popup(defineAsyncComponent(() => import('@/components/forgot-password.vue')), {}, {}, 'closed');
		router.push('/');
	}
});

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.resetPassword,
		icon: 'fas fa-lock',
		bg: 'var(--bg)',
	},
});
</script>

<style lang="scss" scoped>

</style>
