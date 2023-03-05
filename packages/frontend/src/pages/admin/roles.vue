<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="700">
			<div class="_gaps">
				<MkFolder>
					<template #label>{{ i18n.ts._role.baseRole }}</template>
					<div class="_gaps_s">
						<MkFolder>
							<template #label>{{ i18n.ts._role._options.rateLimitFactor }}</template>
							<template #suffix>{{ Math.floor(policies.rateLimitFactor * 100) }}%</template>
							<MkRange :model-value="policies.rateLimitFactor * 100" :min="30" :max="300" :step="10" :text-converter="(v) => `${v}%`" @update:model-value="v => policies.rateLimitFactor = (v / 100)">
								<template #caption>{{ i18n.ts._role._options.descriptionOfRateLimitFactor }}</template>
							</MkRange>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.gtlAvailable }}</template>
							<template #suffix>{{ policies.gtlAvailable ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.gtlAvailable">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.ltlAvailable }}</template>
							<template #suffix>{{ policies.ltlAvailable ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.ltlAvailable">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.canPublicNote }}</template>
							<template #suffix>{{ policies.canPublicNote ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canPublicNote">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.canInvite }}</template>
							<template #suffix>{{ policies.canInvite ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canInvite">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.canManageCustomEmojis }}</template>
							<template #suffix>{{ policies.canManageCustomEmojis ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canManageCustomEmojis">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.driveCapacity }}</template>
							<template #suffix>{{ policies.driveCapacityMb }}MB</template>
							<MkInput v-model="policies.driveCapacityMb" type="number">
								<template #suffix>MB</template>
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.pinMax }}</template>
							<template #suffix>{{ policies.pinLimit }}</template>
							<MkInput v-model="policies.pinLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.antennaMax }}</template>
							<template #suffix>{{ policies.antennaLimit }}</template>
							<MkInput v-model="policies.antennaLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.wordMuteMax }}</template>
							<template #suffix>{{ policies.wordMuteLimit }}</template>
							<MkInput v-model="policies.wordMuteLimit" type="number">
								<template #suffix>chars</template>
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.webhookMax }}</template>
							<template #suffix>{{ policies.webhookLimit }}</template>
							<MkInput v-model="policies.webhookLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.clipMax }}</template>
							<template #suffix>{{ policies.clipLimit }}</template>
							<MkInput v-model="policies.clipLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.noteEachClipsMax }}</template>
							<template #suffix>{{ policies.noteEachClipsLimit }}</template>
							<MkInput v-model="policies.noteEachClipsLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.userListMax }}</template>
							<template #suffix>{{ policies.userListLimit }}</template>
							<MkInput v-model="policies.userListLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.userEachUserListsMax }}</template>
							<template #suffix>{{ policies.userEachUserListsLimit }}</template>
							<MkInput v-model="policies.userEachUserListsLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.canHideAds }}</template>
							<template #suffix>{{ policies.canHideAds ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canHideAds">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkButton primary rounded @click="updateBaseRole">{{ i18n.ts.save }}</MkButton>
					</div>
				</MkFolder>
				<MkButton primary rounded @click="create"><i class="ti ti-plus"></i> {{ i18n.ts._role.new }}</MkButton>
				<div class="_gaps_s">
					<MkFoldableSection>
						<template #header>Manual roles</template>
						<div class="_gaps_s">
							<MkRolePreview v-for="role in roles.filter(x => x.target === 'manual')" :key="role.id" :role="role" :for-moderation="true"/>
						</div>
					</MkFoldableSection>
					<MkFoldableSection>
						<template #header>Conditional roles</template>
						<div class="_gaps_s">
							<MkRolePreview v-for="role in roles.filter(x => x.target === 'conditional')" :key="role.id" :role="role" :for-moderation="true"/>
						</div>
					</MkFoldableSection>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';
import XHeader from './_header_.vue';
import MkInput from '@/components/MkInput.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import MkRange from '@/components/MkRange.vue';
import MkRolePreview from '@/components/MkRolePreview.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { instance } from '@/instance';
import { useRouter } from '@/router';
import MkFoldableSection from '@/components/MkFoldableSection.vue';

const ROLE_POLICIES = [
	'gtlAvailable',
	'ltlAvailable',
	'canPublicNote',
	'canInvite',
	'canManageCustomEmojis',
	'canHideAds',
	'driveCapacityMb',
	'pinLimit',
	'antennaLimit',
	'wordMuteLimit',
	'webhookLimit',
	'clipLimit',
	'noteEachClipsLimit',
	'userListLimit',
	'userEachUserListsLimit',
	'rateLimitFactor',
] as const;

const router = useRouter();

const roles = await os.api('admin/roles/list');

const policies = reactive<Record<typeof ROLE_POLICIES[number], any>>({});
for (const ROLE_POLICY of ROLE_POLICIES) {
	policies[ROLE_POLICY] = instance.policies[ROLE_POLICY];
}

async function updateBaseRole() {
	await os.apiWithDialog('admin/roles/update-default-policies', {
		policies,
	});
}

function create() {
	router.push('/admin/roles/new');
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.ts.roles,
	icon: 'ti ti-badges',
})));
</script>

<style lang="scss" module>

</style>
