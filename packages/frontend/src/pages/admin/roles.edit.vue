<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="600">
			<div class="_gaps">
				<MkInput v-model="name">
					<template #label>{{ i18n.ts._role.name }}</template>
				</MkInput>

				<MkTextarea v-model="description">
					<template #label>{{ i18n.ts._role.description }}</template>
				</MkTextarea>

				<MkSelect v-model="roleType">
					<template #label>{{ i18n.ts._role.type }}</template>
					<template #caption><div v-html="i18n.ts._role.descriptionOfType.replaceAll('\n', '<br>')"></div></template>
					<option value="normal">{{ i18n.ts.noramlUser }}</option>
					<option value="moderator">{{ i18n.ts.moderator }}</option>
					<option value="administrator">{{ i18n.ts.administrator }}</option>
				</MkSelect>

				<FormSlot>
					<template #label>{{ i18n.ts._role.options }}</template>
					<div class="_gaps_s">
						<MkFolder>
							<template #label>{{ i18n.ts._role._options.gtlAvailable }}</template>
							<template #suffix>{{ options_gtlAvailable_useDefault ? i18n.ts._role.useBaseValue : (options_gtlAvailable_value ? i18n.ts.yes : i18n.ts.no) }}</template>
							<div class="_gaps">
								<MkSwitch v-model="options_gtlAvailable_useDefault">
									<template #label>{{ i18n.ts._role.useBaseValue }}</template>
								</MkSwitch>
								<MkSwitch v-model="options_gtlAvailable_value" :disabled="options_gtlAvailable_useDefault">
									<template #label>{{ i18n.ts.enable }}</template>
								</MkSwitch>
							</div>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.ltlAvailable }}</template>
							<template #suffix>{{ options_ltlAvailable_useDefault ? i18n.ts._role.useBaseValue : (options_ltlAvailable_value ? i18n.ts.yes : i18n.ts.no) }}</template>
							<div class="_gaps">
								<MkSwitch v-model="options_ltlAvailable_useDefault">
									<template #label>{{ i18n.ts._role.useBaseValue }}</template>
								</MkSwitch>
								<MkSwitch v-model="options_ltlAvailable_value" :disabled="options_ltlAvailable_useDefault">
									<template #label>{{ i18n.ts.enable }}</template>
								</MkSwitch>
							</div>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.driveCapacity }}</template>
							<template #suffix>{{ options_driveCapacityMb_useDefault ? i18n.ts._role.useBaseValue : (options_driveCapacityMb_value + 'MB') }}</template>
							<div class="_gaps">
								<MkSwitch v-model="options_driveCapacityMb_useDefault">
									<template #label>{{ i18n.ts._role.useBaseValue }}</template>
								</MkSwitch>
								<MkInput v-model="options_driveCapacityMb_value" :disabled="options_driveCapacityMb_useDefault" type="number">
									<template #suffix>MB</template>
								</MkInput>
							</div>
						</MkFolder>

						<MkFolder>
							<template #label>{{ i18n.ts._role._options.antennaMax }}</template>
							<template #suffix>{{ options_antennaLimit_useDefault ? i18n.ts._role.useBaseValue : (options_antennaLimit_value) }}</template>
							<div class="_gaps">
								<MkSwitch v-model="options_antennaLimit_useDefault">
									<template #label>{{ i18n.ts._role.useBaseValue }}</template>
								</MkSwitch>
								<MkInput v-model="options_antennaLimit_value" :disabled="options_antennaLimit_useDefault" type="number">
								</MkInput>
							</div>
						</MkFolder>
					</div>
				</FormSlot>

				<MkSwitch v-model="isPublic">
					<template #label>{{ i18n.ts._role.isPublic }}</template>
					<template #caption>{{ i18n.ts._role.descriptionOfIsPublic }}</template>
				</MkSwitch>

				<div class="_buttons">
					<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ role ? i18n.ts.save : i18n.ts.create }}</MkButton>
					<MkButton v-if="role != null" danger rounded @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
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
import MkTextarea from '@/components/MkTextarea.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import FormSlot from '@/components/form/slot.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { dateString } from '@/filters/date';
import { useRouter } from '@/router';

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

let role = $ref(null);

if (props.id) {
	role = await os.api('admin/roles/show', {
		roleId: props.id,
	});
}

let name = $ref(role?.name ?? 'New Role');
let description = $ref(role?.description ?? '');
let roleType = $ref(role?.isAdministrator ? 'administrator' : role?.isModerator ? 'moderator' : 'normal');
let isPublic = $ref(role?.isPublic ?? false);
let options_gtlAvailable_useDefault = $ref(role?.options?.gtlAvailable?.useDefault ?? true);
let options_gtlAvailable_value = $ref(role?.options?.gtlAvailable?.value ?? false);
let options_ltlAvailable_useDefault = $ref(role?.options?.ltlAvailable?.useDefault ?? true);
let options_ltlAvailable_value = $ref(role?.options?.ltlAvailable?.value ?? false);
let options_driveCapacityMb_useDefault = $ref(role?.options?.driveCapacityMb?.useDefault ?? true);
let options_driveCapacityMb_value = $ref(role?.options?.driveCapacityMb?.value ?? 0);
let options_antennaLimit_useDefault = $ref(role?.options?.antennaLimit?.useDefault ?? true);
let options_antennaLimit_value = $ref(role?.options?.antennaLimit?.value ?? 0);

function getOptions() {
	return {
		gtlAvailable: { useDefault: options_gtlAvailable_useDefault, value: options_gtlAvailable_value },
		ltlAvailable: { useDefault: options_ltlAvailable_useDefault, value: options_ltlAvailable_value },
		driveCapacityMb: { useDefault: options_driveCapacityMb_useDefault, value: options_driveCapacityMb_value },
		antennaLimit: { useDefault: options_antennaLimit_useDefault, value: options_antennaLimit_value },
	};
}

async function save() {
	if (role) {
		os.apiWithDialog('admin/roles/update', {
			roleId: props.id,
			name,
			description,
			isAdministrator: roleType === 'administrator',
			isModerator: roleType === 'moderator',
			isPublic,
			options: getOptions(),
		});
	} else {
		const created = await os.apiWithDialog('admin/roles/create', {
			name,
			description,
			isAdministrator: roleType === 'administrator',
			isModerator: roleType === 'moderator',
			isPublic,
			options: getOptions(),
		});
		router.push('/admin/roles/' + created.id);
	}
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('deleteAreYouSure', { x: role.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('admin/roles/delete', {
		roleId: props.id,
	});

	router.push('/admin/roles');
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => role ? {
	title: i18n.ts._role.edit + ': ' + role.name,
	icon: 'ti ti-badge',
} : {
	title: i18n.ts._role.new,
	icon: 'ti ti-badge',
}));
</script>

<style lang="scss" module>

</style>
