<template>
<div class="_gaps">
	<MkInput v-model="name" :readonly="readonly">
		<template #label>{{ i18n.ts._role.name }}</template>
	</MkInput>

	<MkTextarea v-model="description" :readonly="readonly">
		<template #label>{{ i18n.ts._role.description }}</template>
	</MkTextarea>

	<MkInput v-model="color">
		<template #label>{{ i18n.ts.color }}</template>
		<template #caption>#RRGGBB</template>
	</MkInput>

	<MkSelect v-model="roleType" :readonly="readonly">
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
					<MkSwitch v-model="options_gtlAvailable_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="options_gtlAvailable_value" :disabled="options_gtlAvailable_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.ltlAvailable }}</template>
				<template #suffix>{{ options_ltlAvailable_useDefault ? i18n.ts._role.useBaseValue : (options_ltlAvailable_value ? i18n.ts.yes : i18n.ts.no) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_ltlAvailable_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="options_ltlAvailable_value" :disabled="options_ltlAvailable_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.canPublicNote }}</template>
				<template #suffix>{{ options_canPublicNote_useDefault ? i18n.ts._role.useBaseValue : (options_canPublicNote_value ? i18n.ts.yes : i18n.ts.no) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_canPublicNote_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="options_canPublicNote_value" :disabled="options_canPublicNote_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.driveCapacity }}</template>
				<template #suffix>{{ options_driveCapacityMb_useDefault ? i18n.ts._role.useBaseValue : (options_driveCapacityMb_value + 'MB') }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_driveCapacityMb_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options_driveCapacityMb_value" :disabled="options_driveCapacityMb_useDefault" type="number" :readonly="readonly">
						<template #suffix>MB</template>
					</MkInput>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.antennaMax }}</template>
				<template #suffix>{{ options_antennaLimit_useDefault ? i18n.ts._role.useBaseValue : (options_antennaLimit_value) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_antennaLimit_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options_antennaLimit_value" :disabled="options_antennaLimit_useDefault" type="number" :readonly="readonly">
					</MkInput>
				</div>
			</MkFolder>
		</div>
	</FormSlot>

	<MkSwitch v-model="canEditMembersByModerator" :readonly="readonly">
		<template #label>{{ i18n.ts._role.canEditMembersByModerator }}</template>
		<template #caption>{{ i18n.ts._role.descriptionOfCanEditMembersByModerator }}</template>
	</MkSwitch>

	<MkSwitch v-model="isPublic" :readonly="readonly">
		<template #label>{{ i18n.ts._role.isPublic }}</template>
		<template #caption>{{ i18n.ts._role.descriptionOfIsPublic }}</template>
	</MkSwitch>

	<div v-if="!readonly" class="_buttons">
		<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ role ? i18n.ts.save : i18n.ts.create }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import FormSlot from '@/components/form/slot.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const emit = defineEmits<{
	(ev: 'created', payload: any): void;
	(ev: 'updated'): void;
}>();

const props = defineProps<{
	role?: any;
	readonly?: boolean;
}>();

const role = props.role;

let name = $ref(role?.name ?? 'New Role');
let description = $ref(role?.description ?? '');
let roleType = $ref(role?.isAdministrator ? 'administrator' : role?.isModerator ? 'moderator' : 'normal');
let color = $ref(role?.color ?? null);
let isPublic = $ref(role?.isPublic ?? false);
let canEditMembersByModerator = $ref(role?.canEditMembersByModerator ?? false);
let options_gtlAvailable_useDefault = $ref(role?.options?.gtlAvailable?.useDefault ?? true);
let options_gtlAvailable_value = $ref(role?.options?.gtlAvailable?.value ?? false);
let options_ltlAvailable_useDefault = $ref(role?.options?.ltlAvailable?.useDefault ?? true);
let options_ltlAvailable_value = $ref(role?.options?.ltlAvailable?.value ?? false);
let options_canPublicNote_useDefault = $ref(role?.options?.canPublicNote?.useDefault ?? true);
let options_canPublicNote_value = $ref(role?.options?.canPublicNote?.value ?? false);
let options_driveCapacityMb_useDefault = $ref(role?.options?.driveCapacityMb?.useDefault ?? true);
let options_driveCapacityMb_value = $ref(role?.options?.driveCapacityMb?.value ?? 0);
let options_antennaLimit_useDefault = $ref(role?.options?.antennaLimit?.useDefault ?? true);
let options_antennaLimit_value = $ref(role?.options?.antennaLimit?.value ?? 0);

function getOptions() {
	return {
		gtlAvailable: { useDefault: options_gtlAvailable_useDefault, value: options_gtlAvailable_value },
		ltlAvailable: { useDefault: options_ltlAvailable_useDefault, value: options_ltlAvailable_value },
		canPublicNote: { useDefault: options_canPublicNote_useDefault, value: options_canPublicNote_value },
		driveCapacityMb: { useDefault: options_driveCapacityMb_useDefault, value: options_driveCapacityMb_value },
		antennaLimit: { useDefault: options_antennaLimit_useDefault, value: options_antennaLimit_value },
	};
}

async function save() {
	if (props.readonly) return;
	if (role) {
		os.apiWithDialog('admin/roles/update', {
			roleId: role.id,
			name,
			description,
			color: color === '' ? null : color,
			isAdministrator: roleType === 'administrator',
			isModerator: roleType === 'moderator',
			isPublic,
			canEditMembersByModerator,
			options: getOptions(),
		});
		emit('updated');
	} else {
		const created = await os.apiWithDialog('admin/roles/create', {
			name,
			description,
			color: color === '' ? null : color,
			isAdministrator: roleType === 'administrator',
			isModerator: roleType === 'moderator',
			isPublic,
			canEditMembersByModerator,
			options: getOptions(),
		});
		emit('created', created);
	}
}
</script>

<style lang="scss" module>

</style>
