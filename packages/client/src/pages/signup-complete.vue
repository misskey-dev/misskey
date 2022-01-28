<template>
<div>
	{{ i18n.ts.processing }}
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { login } from '@/account';
import { i18n } from '@/i18n';

const props = defineProps<{
	code: string;
}>();

onMounted(async () => {
	await os.alert({
		type: 'info',
		text: i18n.t('clickToFinishEmailVerification', { ok: i18n.ts.gotIt }),
	});
	const res = await os.apiWithDialog('signup-pending', {
		code: props.code,
	});
	login(res.i, '/');
});

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.signup,
		icon: 'fas fa-user',
	},
});
</script>

<style lang="scss" scoped>

</style>
