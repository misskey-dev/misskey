<template>
<div class="_gaps_m">
	<MkSwitch v-model="$i.injectFeaturedNote" @update:model-value="onChangeInjectFeaturedNote">
		{{ i18n.ts.showFeaturedNotesInTimeline }}
	</MkSwitch>

	<!--
	<MkSwitch v-model="reportError">{{ i18n.ts.sendErrorReports }}<template #caption>{{ i18n.ts.sendErrorReportsDescription }}</template></MkSwitch>
	-->

	<FormLink to="/settings/account-info">{{ i18n.ts.accountInfo }}</FormLink>

	<FormLink to="/registry"><template #icon><i class="ti ti-adjustments"></i></template>{{ i18n.ts.registry }}</FormLink>

	<FormLink to="/settings/delete-account"><template #icon><i class="ti ti-alert-triangle"></i></template>{{ i18n.ts.closeAccount }}</FormLink>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormLink from '@/components/form/link.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const reportError = computed(defaultStore.makeGetterSetter('reportError'));

function onChangeInjectFeaturedNote(v) {
	os.api('i/update', {
		injectFeaturedNote: v,
	}).then((i) => {
		$i!.injectFeaturedNote = i.injectFeaturedNote;
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.other,
	icon: 'ti ti-dots',
});
</script>
