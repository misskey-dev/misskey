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
							<template #label>{{ i18n.ts._role._options.driveCapacity }}</template>
							<template #suffix>{{ options_driveCapacityMb }}MB</template>
							<MkInput v-model="options_driveCapacityMb" type="number">
								<template #suffix>MB</template>
							</MkInput>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.antennaMax }}</template>
							<template #suffix>{{ options_antennaLimit }}</template>
							<MkInput v-model="options_antennaLimit" type="number">
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
let options_driveCapacityMb = $ref(instance.baseRole.driveCapacityMb);
let options_antennaLimit = $ref(instance.baseRole.antennaLimit);

async function updateBaseRole() {
	await os.apiWithDialog('admin/roles/update-default-role-override', {
		options: {
			gtlAvailable: options_gtlAvailable,
			ltlAvailable: options_ltlAvailable,
			canPublicNote: options_canPublicNote,
			driveCapacityMb: options_driveCapacityMb,
			antennaLimit: options_antennaLimit,
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
