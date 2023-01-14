<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="700">
			<div class="_gaps">
				<MkButton primary rounded @click="create"><i class="ti ti-plus"></i> {{ i18n.ts._role.new }}</MkButton>
				<MkFolder>
					<template #label>{{ i18n.ts._role.baseRole }}</template>
					<div class="_gaps">
						<MkFolder>
							<template #label>{{ i18n.ts._role._options.gtlAvailable }}</template>
							<template #suffix>{{ options_gtlAvailable ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="options_gtlAvailable">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.ltlAvailable }}</template>
							<template #suffix>{{ options_ltlAvailable ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="options_ltlAvailable">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.canPublicNote }}</template>
							<template #suffix>{{ options_canPublicNote ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="options_canPublicNote">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.canInvite }}</template>
							<template #suffix>{{ options_canInvite ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="options_canInvite">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.canManageCustomEmojis }}</template>
							<template #suffix>{{ options_canManageCustomEmojis ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="options_canManageCustomEmojis">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.driveCapacity }}</template>
							<template #suffix>{{ options_driveCapacityMb }}MB</template>
							<MkInput v-model="options_driveCapacityMb" type="number">
								<template #suffix>MB</template>
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.pinMax }}</template>
							<template #suffix>{{ options_pinLimit }}</template>
							<MkInput v-model="options_pinLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.antennaMax }}</template>
							<template #suffix>{{ options_antennaLimit }}</template>
							<MkInput v-model="options_antennaLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.wordMuteMax }}</template>
							<template #suffix>{{ options_wordMuteLimit }}</template>
							<MkInput v-model="options_wordMuteLimit" type="number">
								<template #suffix>chars</template>
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.webhookMax }}</template>
							<template #suffix>{{ options_webhookLimit }}</template>
							<MkInput v-model="options_webhookLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.clipMax }}</template>
							<template #suffix>{{ options_clipLimit }}</template>
							<MkInput v-model="options_clipLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.noteEachClipsMax }}</template>
							<template #suffix>{{ options_noteEachClipsLimit }}</template>
							<MkInput v-model="options_noteEachClipsLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.userListMax }}</template>
							<template #suffix>{{ options_userListLimit }}</template>
							<MkInput v-model="options_userListLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.userEachUserListsMax }}</template>
							<template #suffix>{{ options_userEachUserListsLimit }}</template>
							<MkInput v-model="options_userEachUserListsLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkButton primary rounded @click="updateBaseRole">{{ i18n.ts.save }}</MkButton>
					</div>
				</MkFolder>
				<div class="_gaps_s">
					<MkRolePreview v-for="role in roles" :key="role.id" :role="role"/>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XHeader from './_header_.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import MkRolePreview from '@/components/MkRolePreview.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { instance } from '@/instance';
import { useRouter } from '@/router';

const router = useRouter();

const roles = await os.api('admin/roles/list');

let options_gtlAvailable = $ref(instance.baseRole.gtlAvailable);
let options_ltlAvailable = $ref(instance.baseRole.ltlAvailable);
let options_canPublicNote = $ref(instance.baseRole.canPublicNote);
let options_canInvite = $ref(instance.baseRole.canInvite);
let options_canManageCustomEmojis = $ref(instance.baseRole.canManageCustomEmojis);
let options_driveCapacityMb = $ref(instance.baseRole.driveCapacityMb);
let options_pinLimit = $ref(instance.baseRole.pinLimit);
let options_antennaLimit = $ref(instance.baseRole.antennaLimit);
let options_wordMuteLimit = $ref(instance.baseRole.wordMuteLimit);
let options_webhookLimit = $ref(instance.baseRole.webhookLimit);
let options_clipLimit = $ref(instance.baseRole.clipLimit);
let options_noteEachClipsLimit = $ref(instance.baseRole.noteEachClipsLimit);
let options_userListLimit = $ref(instance.baseRole.userListLimit);
let options_userEachUserListsLimit = $ref(instance.baseRole.userEachUserListsLimit);

async function updateBaseRole() {
	await os.apiWithDialog('admin/roles/update-default-role-override', {
		options: {
			gtlAvailable: options_gtlAvailable,
			ltlAvailable: options_ltlAvailable,
			canPublicNote: options_canPublicNote,
			canInvite: options_canInvite,
			canManageCustomEmojis: options_canManageCustomEmojis,
			driveCapacityMb: options_driveCapacityMb,
			pinLimit: options_pinLimit,
			antennaLimit: options_antennaLimit,
			wordMuteLimit: options_wordMuteLimit,
			webhookLimit: options_webhookLimit,
			clipLimit: options_clipLimit,
			noteEachClipsLimit: options_noteEachClipsLimit,
			userListLimit: options_userListLimit,
			userEachUserListsLimit: options_userEachUserListsLimit,
		},
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
