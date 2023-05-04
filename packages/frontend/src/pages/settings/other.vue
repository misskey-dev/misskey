<template>
<div class="_gaps_m">
	<!--
	<MkSwitch v-model="$i.injectFeaturedNote" @update:model-value="onChangeInjectFeaturedNote">
		<template #label>{{ i18n.ts.showFeaturedNotesInTimeline }}</template>
	</MkSwitch>
	-->

	<!--
	<MkSwitch v-model="reportError">{{ i18n.ts.sendErrorReports }}<template #caption>{{ i18n.ts.sendErrorReportsDescription }}</template></MkSwitch>
	-->

	<div class="_gaps_s">
		<FormLink to="/settings/account-info"><template #icon><i class="ti ti-info-circle"></i></template>{{ i18n.ts.accountInfo }}</FormLink>
		<FormLink to="/registry"><template #icon><i class="ti ti-adjustments"></i></template>{{ i18n.ts.registry }}</FormLink>
		<FormLink to="/settings/delete-account"><template #icon><i class="ti ti-alert-triangle"></i></template>{{ i18n.ts.closeAccount }}</FormLink>
	</div>

	<MkFolder>
		<template #icon><i class="ti ti-flask"></i></template>
		<template #label>{{ i18n.ts.experimentalFeatures }}</template>

		<div class="_gaps_m">
			<MkSwitch v-model="enableCondensedLineForAcct">
				<template #label>Enable condensed line for acct</template>
			</MkSwitch>
		</div>
	</MkFolder>
</div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormLink from '@/components/form/link.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { unisonReload } from '@/scripts/unison-reload';

const reportError = computed(defaultStore.makeGetterSetter('reportError'));
const enableCondensedLineForAcct = computed(defaultStore.makeGetterSetter('enableCondensedLineForAcct'));

function onChangeInjectFeaturedNote(v) {
	os.api('i/update', {
		injectFeaturedNote: v,
	}).then((i) => {
		$i!.injectFeaturedNote = i.injectFeaturedNote;
	});
}

async function reloadAsk() {
	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

watch([
	enableCondensedLineForAcct,
], async () => {
	await reloadAsk();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.other,
	icon: 'ti ti-dots',
});
</script>
