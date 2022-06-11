<template>
<div class="_formRoot">
	<FormSwitch v-model="$i.injectFeaturedNote" class="_formBlock" @update:modelValue="onChangeInjectFeaturedNote">
		{{ i18n.ts.showFeaturedNotesInTimeline }}
	</FormSwitch>

	<!--
	<FormSwitch v-model="reportError" class="_formBlock">{{ i18n.ts.sendErrorReports }}<template #caption>{{ i18n.ts.sendErrorReportsDescription }}</template></FormSwitch>
	-->

	<FormLink to="/settings/account-info" class="_formBlock">{{ i18n.ts.accountInfo }}</FormLink>

	<FormLink to="/settings/delete-account" class="_formBlock"><template #icon><i class="fas fa-exclamation-triangle"></i></template>{{ i18n.ts.closeAccount }}</FormLink>
</div>
</template>

<script lang="ts" setup>
import { computed, defineExpose } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormLink from '@/components/form/link.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import * as symbols from '@/symbols';
import { $i } from '@/account';
import { i18n } from '@/i18n';

const reportError = computed(defaultStore.makeGetterSetter('reportError'));

function onChangeInjectFeaturedNote(v) {
	os.api('i/update', {
		injectFeaturedNote: v
	}).then((i) => {
		$i!.injectFeaturedNote = i.injectFeaturedNote;
	});
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.other,
		icon: 'fas fa-ellipsis-h',
		bg: 'var(--bg)',
	}
});
</script>
