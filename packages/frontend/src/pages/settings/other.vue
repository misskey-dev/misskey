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

		<div class="_gaps_s">
			<SearchMarker :keywords="['account', 'info']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-info-circle"></i></SearchIcon></template>
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

						<SearchMarker :keywords="['role', 'policy']">
							<MkFolder>
								<template #icon><i class="ti ti-badges"></i></template>
								<template #label><SearchLabel>{{ i18n.ts._role.policies }}</SearchLabel></template>

								<div class="_gaps_s">
									<div v-for="policy in Object.keys($i.policies)" :key="policy">
										{{ policy }} ... {{ $i.policies[policy] }}
									</div>
								</div>
							</MkFolder>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['roles']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-badges"></i></SearchIcon></template>
					<template #label><SearchLabel>{{ i18n.ts.rolesAssignedToMe }}</SearchLabel></template>

					<MkRolePreview v-for="role in $i.roles" :key="role.id" :role="role" :forModeration="false"/>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['account', 'move', 'migration']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-plane"></i></SearchIcon></template>
					<template #label><SearchLabel>{{ i18n.ts.accountMigration }}</SearchLabel></template>

					<XMigration/>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['account', 'close', 'delete']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-alert-triangle"></i></SearchIcon></template>
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
					<template #icon><SearchIcon><i class="ti ti-flask"></i></SearchIcon></template>
					<template #label><SearchLabel>{{ i18n.ts.experimentalFeatures }}</SearchLabel></template>

					<div class="_gaps_m">
						<MkSwitch v-model="enableCondensedLine">
							<template #label>Enable condensed line</template>
						</MkSwitch>
						<MkSwitch v-model="skipNoteRender">
							<template #label>Enable note render skipping</template>
						</MkSwitch>
						<MkSwitch v-model="stackingRouterView">
							<template #label>Enable stacking router view</template>
						</MkSwitch>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['developer', 'mode', 'debug']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-code"></i></SearchIcon></template>
					<template #label><SearchLabel>{{ i18n.ts.developer }}</SearchLabel></template>

					<div class="_gaps_m">
						<MkSwitch v-model="devMode">
							<template #label>{{ i18n.ts.devMode }}</template>
						</MkSwitch>
					</div>
				</MkFolder>
			</SearchMarker>
		</div>

		<hr>

		<FormLink to="/registry"><template #icon><i class="ti ti-adjustments"></i></template>{{ i18n.ts.registry }}</FormLink>

		<hr>

		<FormSlot>
			<MkButton danger @click="migrate"><i class="ti ti-refresh"></i> {{ i18n.ts.migrateOldSettings }}</MkButton>
			<template #caption>{{ i18n.ts.migrateOldSettings_description }}</template>
		</FormSlot>
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
import FormSlot from '@/components/form/slot.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { ensureSignin } from '@/i.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { reloadAsk } from '@/utility/reload-ask.js';
import FormSection from '@/components/form/section.vue';
import { prefer } from '@/preferences.js';
import MkRolePreview from '@/components/MkRolePreview.vue';
import { signout } from '@/signout.js';
import { migrateOldSettings } from '@/pref-migrate.js';

const $i = ensureSignin();

const reportError = prefer.model('reportError');
const enableCondensedLine = prefer.model('enableCondensedLine');
const skipNoteRender = prefer.model('skipNoteRender');
const devMode = prefer.model('devMode');
const stackingRouterView = prefer.model('experimental.stackingRouterView');

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

function migrate() {
	migrateOldSettings();
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.other,
	icon: 'ti ti-dots',
}));
</script>
