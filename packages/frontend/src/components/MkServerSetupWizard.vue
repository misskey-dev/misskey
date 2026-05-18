<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkInput v-model="q_name" data-cy-server-name>
		<template #label>{{ i18n.ts.instanceName }}</template>
	</MkInput>

	<MkFolder :defaultOpen="true">
		<template #label>{{ i18n.ts._serverSetupWizard.howWillYouUseMisskey }}</template>
		<template #icon><i class="ti ti-settings-question"></i></template>

		<div class="_gaps_s">
			<MkRadios
				v-model="q_use"
				:options="[
					{ value: 'single', label: i18n.ts._serverSetupWizard._use.single, icon: 'ti ti-user', caption: i18n.ts._serverSetupWizard._use.single_description },
					{ value: 'group', label: i18n.ts._serverSetupWizard._use.group, icon: 'ti ti-lock', caption: i18n.ts._serverSetupWizard._use.group_description },
					{ value: 'open', label: i18n.ts._serverSetupWizard._use.open, icon: 'ti ti-world', caption: i18n.ts._serverSetupWizard._use.open_description },
				]"
				vertical
			>
			</MkRadios>

			<MkInfo v-if="q_use === 'single'">{{ i18n.ts._serverSetupWizard._use.single_youCanCreateMultipleAccounts }}</MkInfo>
			<MkInfo v-if="q_use === 'open'" warn><b>{{ i18n.ts.advice }}:</b> {{ i18n.ts._serverSetupWizard.openServerAdvice }}</MkInfo>
			<MkInfo v-if="q_use === 'open'" warn><b>{{ i18n.ts.advice }}:</b> {{ i18n.ts._serverSetupWizard.openServerAntiSpamAdvice }}</MkInfo>
		</div>
	</MkFolder>

	<MkFolder v-if="q_use !== 'single'" :defaultOpen="true">
		<template #label>{{ i18n.ts._serverSetupWizard.howManyUsersDoYouExpect }}</template>
		<template #icon><i class="ti ti-users"></i></template>

		<div class="_gaps_s">
			<MkRadios
				v-model="q_scale"
				:options="[
					{ value: 'small', label: i18n.ts._serverSetupWizard._scale.small, icon: 'ti ti-user' },
					{ value: 'medium', label: i18n.ts._serverSetupWizard._scale.medium, icon: 'ti ti-users' },
					{ value: 'large', label: i18n.ts._serverSetupWizard._scale.large, icon: 'ti ti-users-group' },
				]"
				vertical
			>
			</MkRadios>

			<MkInfo v-if="q_scale === 'large'"><b>{{ i18n.ts.advice }}:</b> {{ i18n.ts._serverSetupWizard.largeScaleServerAdvice }}</MkInfo>
		</div>
	</MkFolder>

	<MkFolder :defaultOpen="true">
		<template #label>{{ i18n.ts._serverSetupWizard.doYouConnectToFediverse }}</template>
		<template #icon><i class="ti ti-planet"></i></template>

		<div class="_gaps_s">
			<div>{{ i18n.ts._serverSetupWizard.doYouConnectToFediverse_description1 }}<br>{{ i18n.ts._serverSetupWizard.doYouConnectToFediverse_description2 }}<br><MkLink target="_blank" url="https://wikipedia.org/wiki/Fediverse">{{ i18n.ts.learnMore }}</MkLink></div>

			<MkRadios
				v-model="q_federation"
				:options="[
					{ value: 'yes', label: i18n.ts.yes },
					{ value: 'no', label: i18n.ts.no },
				]"
				vertical
			>
			</MkRadios>

			<MkInfo v-if="q_federation === 'yes'">{{ i18n.ts._serverSetupWizard.youCanConfigureMoreFederationSettingsLater }}</MkInfo>

			<MkSwitch v-if="q_federation === 'yes'" v-model="q_remoteContentsCleaning">
				<template #label>{{ i18n.ts._serverSetupWizard.remoteContentsCleaning }}</template>
				<template #caption>{{ i18n.ts._serverSetupWizard.remoteContentsCleaning_description }}</template>
			</MkSwitch>
		</div>
	</MkFolder>

	<MkFolder v-if="q_use === 'open' || q_federation === 'yes'" :defaultOpen="true">
		<template #label>{{ i18n.ts._serverSetupWizard.adminInfo }}</template>
		<template #icon><i class="ti ti-mail"></i></template>

		<div class="_gaps_s">
			<div>{{ i18n.ts._serverSetupWizard.adminInfo_description }}</div>

			<MkInfo warn>{{ i18n.ts._serverSetupWizard.adminInfo_mustBeFilled }}</MkInfo>

			<MkInput v-model="q_adminName">
				<template #label>{{ i18n.ts.maintainerName }}</template>
			</MkInput>

			<MkInput v-model="q_adminEmail" type="email">
				<template #label>{{ i18n.ts.maintainerEmail }}</template>
			</MkInput>
		</div>
	</MkFolder>

	<MkFolder :defaultOpen="true" :maxHeight="300">
		<template #label>{{ i18n.ts._serverSetupWizard.followingSettingsAreRecommended }}</template>
		<template #icon><i class="ti ti-adjustments-alt"></i></template>

		<div class="_gaps_s">
			<div>
				<div><b>{{ i18n.ts._serverSettings.singleUserMode }}:</b></div>
				<div>{{ serverSettings.singleUserMode ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._serverSettings.openRegistration }}:</b></div>
				<div>{{ !serverSettings.disableRegistration ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts.emailRequiredForSignup }}:</b></div>
				<div>{{ serverSettings.emailRequiredForSignup ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>Log IP:</b></div>
				<div>{{ serverSettings.enableIpLogging ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts.federation }}:</b></div>
				<div>{{ serverSettings.federation === 'none' ? i18n.ts.no : i18n.ts.all }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._serverSettings.remoteNotesCleaning }}:</b></div>
				<div>{{ serverSettings.enableRemoteNotesCleaning ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>FTT:</b></div>
				<div>{{ serverSettings.enableFanoutTimeline ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>FTT/{{ i18n.ts._serverSettings.fanoutTimelineDbFallback }}:</b></div>
				<div>{{ serverSettings.enableFanoutTimelineDbFallback ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>RBT:</b></div>
				<div>{{ serverSettings.enableReactionsBuffering ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>

			<div>
				<div><b>{{ i18n.ts._serverSettings.entrancePageStyle }}:</b></div>
				<div>{{ serverSettings.clientOptions?.entrancePageStyle }}</div>
			</div>

			<div>
				<div><b>{{ i18n.ts._role.baseRole }}/{{ i18n.ts._role._options.rateLimitFactor }}:</b></div>
				<div>{{ defaultPolicies.rateLimitFactor }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._role.baseRole }}/{{ i18n.ts._role._options.driveCapacity }}:</b></div>
				<div>{{ defaultPolicies.driveCapacityMb }} MB</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._role.baseRole }}/{{ i18n.ts._role._options.userListMax }}:</b></div>
				<div>{{ defaultPolicies.userListLimit }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._role.baseRole }}/{{ i18n.ts._role._options.antennaMax }}:</b></div>
				<div>{{ defaultPolicies.antennaLimit }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._role.baseRole }}/{{ i18n.ts._role._options.webhookMax }}:</b></div>
				<div>{{ defaultPolicies.webhookLimit }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._role.baseRole }}/{{ i18n.ts._role._options.canImportFollowing }}:</b></div>
				<div>{{ defaultPolicies.canImportFollowing ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._role.baseRole }}/{{ i18n.ts._role._options.canImportMuting }}:</b></div>
				<div>{{ defaultPolicies.canImportMuting ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._role.baseRole }}/{{ i18n.ts._role._options.canImportBlocking }}:</b></div>
				<div>{{ defaultPolicies.canImportBlocking ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._role.baseRole }}/{{ i18n.ts._role._options.canImportUserLists }}:</b></div>
				<div>{{ defaultPolicies.canImportUserLists ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
			<div>
				<div><b>{{ i18n.ts._role.baseRole }}/{{ i18n.ts._role._options.canImportAntennas }}:</b></div>
				<div>{{ defaultPolicies.canImportAntennas ? i18n.ts.yes : i18n.ts.no }}</div>
			</div>
		</div>

		<template #footer>
			<MkButton gradate large rounded data-cy-server-setup-wizard-apply style="margin: 0 auto;" @click="applySettings">
				<i class="ti ti-check"></i> {{ i18n.ts._serverSetupWizard.applyTheseSettings }}
			</MkButton>
		</template>
	</MkFolder>
</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkFolder from '@/components/MkFolder.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkLink from '@/components/MkLink.vue';

const emit = defineEmits<{
	(ev: 'finished'): void;
}>();

const props = withDefaults(defineProps<{
	token?: string;
}>(), {
});

const q_name = ref('');
const q_use = ref<'single' | 'group' | 'open'>('single');
const q_scale = ref<'small' | 'medium' | 'large'>('small');
const q_federation = ref<'yes' | 'no'>('no');
const q_remoteContentsCleaning = ref(true);
const q_adminName = ref('');
const q_adminEmail = ref('');

const serverSettings = computed<Misskey.entities.AdminUpdateMetaRequest>(() => {
	let enableReactionsBuffering;
	if (q_use.value === 'single') {
		enableReactionsBuffering = false;
	} else {
		enableReactionsBuffering = q_scale.value !== 'small';
	}

	return {
		singleUserMode: q_use.value === 'single',
		disableRegistration: q_use.value !== 'open',
		emailRequiredForSignup: q_use.value === 'open',
		enableIpLogging: q_use.value === 'open',
		federation: q_federation.value === 'yes' ? 'all' : 'none',
		enableRemoteNotesCleaning: q_remoteContentsCleaning.value,
		enableFanoutTimeline: true,
		enableFanoutTimelineDbFallback: q_use.value === 'single',
		enableReactionsBuffering,
		clientOptions: {
			entrancePageStyle: q_use.value === 'open' ? 'classic' : 'simple',
		},
	};
});

const defaultPolicies = computed<Partial<Misskey.entities.RolePolicies>>(() => {
	let driveCapacityMb: Misskey.entities.RolePolicies['driveCapacityMb'] | undefined;
	if (q_use.value === 'single') {
		driveCapacityMb = 8192;
	} else if (q_use.value === 'group') {
		driveCapacityMb = 1000;
	} else if (q_use.value === 'open') {
		driveCapacityMb = 100;
	}

	let rateLimitFactor: Misskey.entities.RolePolicies['rateLimitFactor'] | undefined;
	if (q_use.value === 'single') {
		rateLimitFactor = 0.3;
	} else if (q_use.value === 'group') {
		rateLimitFactor = 0.7;
	} else if (q_use.value === 'open') {
		if (q_scale.value === 'small') {
			rateLimitFactor = 1;
		} else if (q_scale.value === 'medium') {
			rateLimitFactor = 1.25;
		} else if (q_scale.value === 'large') {
			rateLimitFactor = 1.5;
		}
	}

	let userListLimit: Misskey.entities.RolePolicies['userListLimit'] | undefined;
	if (q_use.value === 'single') {
		userListLimit = 100;
	} else if (q_use.value === 'group') {
		userListLimit = 5;
	} else if (q_use.value === 'open') {
		userListLimit = 3;
	}

	let antennaLimit: Misskey.entities.RolePolicies['antennaLimit'] | undefined;
	if (q_use.value === 'single') {
		antennaLimit = 100;
	} else if (q_use.value === 'group') {
		antennaLimit = 5;
	} else if (q_use.value === 'open') {
		antennaLimit = 0;
	}

	let webhookLimit: Misskey.entities.RolePolicies['webhookLimit'] | undefined;
	if (q_use.value === 'single') {
		webhookLimit = 100;
	} else if (q_use.value === 'group') {
		webhookLimit = 0;
	} else if (q_use.value === 'open') {
		webhookLimit = 0;
	}

	let canImportFollowing: Misskey.entities.RolePolicies['canImportFollowing'];
	if (q_use.value === 'single') {
		canImportFollowing = true;
	} else {
		canImportFollowing = false;
	}

	let canImportMuting: Misskey.entities.RolePolicies['canImportMuting'];
	if (q_use.value === 'single') {
		canImportMuting = true;
	} else {
		canImportMuting = false;
	}

	let canImportBlocking: Misskey.entities.RolePolicies['canImportBlocking'];
	if (q_use.value === 'single') {
		canImportBlocking = true;
	} else {
		canImportBlocking = false;
	}

	let canImportUserLists: Misskey.entities.RolePolicies['canImportUserLists'];
	if (q_use.value === 'single') {
		canImportUserLists = true;
	} else {
		canImportUserLists = false;
	}

	let canImportAntennas: Misskey.entities.RolePolicies['canImportAntennas'];
	if (q_use.value === 'single') {
		canImportAntennas = true;
	} else {
		canImportAntennas = false;
	}

	return {
		rateLimitFactor,
		driveCapacityMb,
		userListLimit,
		antennaLimit,
		webhookLimit,
		canImportFollowing,
		canImportMuting,
		canImportBlocking,
		canImportUserLists,
		canImportAntennas,
	};
});

function applySettings() {
	const _close = os.waiting();
	Promise.all([
		misskeyApi('admin/update-meta', {
			...serverSettings.value,
			name: q_name.value === '' ? undefined : q_name.value,
			maintainerName: q_adminName.value === '' ? undefined : q_adminName.value,
			maintainerEmail: q_adminEmail.value === '' ? undefined : q_adminEmail.value,
		}, props.token),
		misskeyApi('admin/roles/update-default-policies', {
			// @ts-expect-error バックエンド側の型
			policies: defaultPolicies.value,
		}, props.token),
	]).then(() => {
		emit('finished');
	}).catch((err) => {
		os.alert({
			type: 'error',
			title: err.code,
			text: err.message,
		});
	}).finally(() => {
		_close();
	});
}
</script>
