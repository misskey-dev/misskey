<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/other" :label="i18n.ts.other" :keywords="['other']" icon="ti ti-dots">
	<div class="_gaps_m">
		<!--
		<MkSwitch v-model="$i.injectFeaturedNote" @update:model-value="onChangeInjectFeaturedNote">
			<template #label>{{ i18n.ts.showFeaturedNotesInTimeline }}</template>
		</MkSwitch>
		-->

		<!--
		<MkSwitch v-model="reportError">{{ i18n.ts.sendErrorReports }}<template #caption>{{ i18n.ts.sendErrorReportsDescription }}</template></MkSwitch>
		-->

		<FormSection first>
			<div class="_gaps_s">
				<SearchMarker :keywords="['account', 'info']">
					<MkFolder>
						<template #icon><i class="ti ti-info-circle"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.accountInfo }}</SearchLabel></template>

						<div class="_gaps_m">
							<MkKeyValue>
								<template #key>ID</template>
								<template #value><span class="_monospace">{{ $i.id }}</span></template>
							</MkKeyValue>

							<MkKeyValue>
								<template #key>{{ i18n.ts.registeredDate }}</template>
								<template #value><MkTime :time="$i.createdAt" mode="detail"/></template>
							</MkKeyValue>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['account', 'move', 'migration']">
					<MkFolder>
						<template #icon><i class="ti ti-plane"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.accountMigration }}</SearchLabel></template>

						<XMigration/>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['account', 'close', 'delete']">
					<MkFolder>
						<template #icon><i class="ti ti-alert-triangle"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.closeAccount }}</SearchLabel></template>

						<div class="_gaps_m">
							<FormInfo warn>{{ i18n.ts._accountDelete.mayTakeTime }}</FormInfo>
							<FormInfo>{{ i18n.ts._accountDelete.sendEmail }}</FormInfo>
							<MkButton v-if="!$i.isDeleted" danger @click="deleteAccount"><SearchKeyword>{{ i18n.ts._accountDelete.requestAccountDelete }}</SearchKeyword></MkButton>
							<MkButton v-else disabled>{{ i18n.ts._accountDelete.inProgress }}</MkButton>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['experimental', 'feature', 'flags']">
					<MkFolder>
						<template #icon><i class="ti ti-flask"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.experimentalFeatures }}</SearchLabel></template>

						<div class="_gaps_m">
							<MkSwitch v-model="enableCondensedLine">
								<template #label>Enable condensed line</template>
							</MkSwitch>
							<MkSwitch v-model="skipNoteRender">
								<template #label>Enable note render skipping</template>
							</MkSwitch>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['developer', 'mode', 'debug']">
					<MkFolder>
						<template #icon><i class="ti ti-code"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.developer }}</SearchLabel></template>

						<div class="_gaps_m">
							<MkSwitch v-model="devMode">
								<template #label>{{ i18n.ts.devMode }}</template>
							</MkSwitch>
						</div>
					</MkFolder>
				</SearchMarker>
			</div>
		</FormSection>

		<FormSection>
			<FormLink to="/registry"><template #icon><i class="ti ti-adjustments"></i></template>{{ i18n.ts.registry }}</FormLink>
		</FormSection>

		<FormSection>
			<div class="_gaps_s">
				<MkSwitch v-model="defaultWithReplies">{{ i18n.ts.withRepliesByDefaultForNewlyFollowed }}</MkSwitch>
				<MkButton danger @click="updateRepliesAll(true)"><i class="ti ti-messages"></i> {{ i18n.ts.showRepliesToOthersInTimelineAll }}</MkButton>
				<MkButton danger @click="updateRepliesAll(false)"><i class="ti ti-messages-off"></i> {{ i18n.ts.hideRepliesToOthersInTimelineAll }}</MkButton>
			</div>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import XMigration from './migration.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormLink from '@/components/form/link.vue';
import MkFolder from '@/components/MkFolder.vue';
import FormInfo from '@/components/MkInfo.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { store } from '@/store.js';
import { signout, signinRequired } from '@/account.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { reloadAsk } from '@/scripts/reload-ask.js';
import FormSection from '@/components/form/section.vue';
import { prefer } from '@/preferences.js';

const $i = signinRequired();

const reportError = prefer.model('reportError');
const enableCondensedLine = prefer.model('enableCondensedLine');
const skipNoteRender = prefer.model('skipNoteRender');
const devMode = prefer.model('devMode');
const defaultWithReplies = computed(store.makeGetterSetter('defaultWithReplies'));

watch(skipNoteRender, async () => {
	await reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

async function deleteAccount() {
	{
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.ts.deleteAccountConfirm,
		});
		if (canceled) return;
	}

	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	await os.apiWithDialog('i/delete-account', {
		password: auth.result.password,
		token: auth.result.token,
	});

	await os.alert({
		title: i18n.ts._accountDelete.started,
	});

	await signout();
}

async function updateRepliesAll(withReplies: boolean) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: withReplies ? i18n.ts.confirmShowRepliesAll : i18n.ts.confirmHideRepliesAll,
	});
	if (canceled) return;

	misskeyApi('following/update-all', { withReplies });
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.other,
	icon: 'ti ti-dots',
}));
</script>
