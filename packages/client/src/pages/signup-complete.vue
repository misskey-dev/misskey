<template>
<div>
	{{ i18n.ts.processing }}
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import * as os from '@/os';
import { login } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

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

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.signup,
	icon: 'ti ti-user',
});
</script>

<style lang="scss" scoped>

</style>
