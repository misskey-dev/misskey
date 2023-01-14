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

	<MkSelect v-model="rolePermission" :readonly="readonly">
		<template #label>{{ i18n.ts._role.permission }}</template>
		<template #caption><div v-html="i18n.ts._role.descriptionOfPermission.replaceAll('\n', '<br>')"></div></template>
		<option value="normal">{{ i18n.ts.normalUser }}</option>
		<option value="moderator">{{ i18n.ts.moderator }}</option>
		<option value="administrator">{{ i18n.ts.administrator }}</option>
	</MkSelect>

	<MkSelect v-model="target" :readonly="readonly">
		<template #label>{{ i18n.ts._role.assignTarget }}</template>
		<template #caption><div v-html="i18n.ts._role.descriptionOfAssignTarget.replaceAll('\n', '<br>')"></div></template>
		<option value="manual">{{ i18n.ts._role.manual }}</option>
		<option value="conditional">{{ i18n.ts._role.conditional }}</option>
	</MkSelect>

	<MkFolder v-if="target === 'conditional'" default-open>
		<template #label>{{ i18n.ts._role.condition }}</template>
		<div class="_gaps">
			<RolesEditorFormula v-model="condFormula"/>
		</div>
	</MkFolder>

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
				<template #label>{{ i18n.ts._role._options.canInvite }}</template>
				<template #suffix>{{ options_canInvite_useDefault ? i18n.ts._role.useBaseValue : (options_canInvite_value ? i18n.ts.yes : i18n.ts.no) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_canInvite_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="options_canInvite_value" :disabled="options_canInvite_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.canManageCustomEmojis }}</template>
				<template #suffix>{{ options_canManageCustomEmojis_useDefault ? i18n.ts._role.useBaseValue : (options_canManageCustomEmojis_value ? i18n.ts.yes : i18n.ts.no) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_canManageCustomEmojis_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="options_canManageCustomEmojis_value" :disabled="options_canManageCustomEmojis_useDefault" :readonly="readonly">
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
				<template #label>{{ i18n.ts._role._options.pinMax }}</template>
				<template #suffix>{{ options_pinLimit_useDefault ? i18n.ts._role.useBaseValue : (options_pinLimit_value) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_pinLimit_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options_pinLimit_value" :disabled="options_pinLimit_useDefault" type="number" :readonly="readonly">
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

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.wordMuteMax }}</template>
				<template #suffix>{{ options_wordMuteLimit_useDefault ? i18n.ts._role.useBaseValue : (options_wordMuteLimit_value) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_wordMuteLimit_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options_wordMuteLimit_value" :disabled="options_wordMuteLimit_useDefault" type="number" :readonly="readonly">
						<template #suffix>chars</template>
					</MkInput>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.webhookMax }}</template>
				<template #suffix>{{ options_webhookLimit_useDefault ? i18n.ts._role.useBaseValue : (options_webhookLimit_value) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_webhookLimit_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options_webhookLimit_value" :disabled="options_webhookLimit_useDefault" type="number" :readonly="readonly">
					</MkInput>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.clipMax }}</template>
				<template #suffix>{{ options_clipLimit_useDefault ? i18n.ts._role.useBaseValue : (options_clipLimit_value) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_clipLimit_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options_clipLimit_value" :disabled="options_clipLimit_useDefault" type="number" :readonly="readonly">
					</MkInput>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.noteEachClipsMax }}</template>
				<template #suffix>{{ options_noteEachClipsLimit_useDefault ? i18n.ts._role.useBaseValue : (options_noteEachClipsLimit_value) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_noteEachClipsLimit_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options_noteEachClipsLimit_value" :disabled="options_noteEachClipsLimit_useDefault" type="number" :readonly="readonly">
					</MkInput>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.userListMax }}</template>
				<template #suffix>{{ options_userListLimit_useDefault ? i18n.ts._role.useBaseValue : (options_userListLimit_value) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_userListLimit_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options_userListLimit_value" :disabled="options_userListLimit_useDefault" type="number" :readonly="readonly">
					</MkInput>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.userEachUserListsMax }}</template>
				<template #suffix>{{ options_userEachUserListsLimit_useDefault ? i18n.ts._role.useBaseValue : (options_userEachUserListsLimit_value) }}</template>
				<div class="_gaps">
					<MkSwitch v-model="options_userEachUserListsLimit_useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options_userEachUserListsLimit_value" :disabled="options_userEachUserListsLimit_useDefault" type="number" :readonly="readonly">
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
import { computed, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import RolesEditorFormula from './RolesEditorFormula.vue';
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
let rolePermission = $ref(role?.isAdministrator ? 'administrator' : role?.isModerator ? 'moderator' : 'normal');
let color = $ref(role?.color ?? null);
let target = $ref(role?.target ?? 'manual');
let condFormula = $ref(role?.condFormula ?? { id: uuid(), type: 'isRemote' });
let isPublic = $ref(role?.isPublic ?? false);
let canEditMembersByModerator = $ref(role?.canEditMembersByModerator ?? false);
let options_gtlAvailable_useDefault = $ref(role?.options?.gtlAvailable?.useDefault ?? true);
let options_gtlAvailable_value = $ref(role?.options?.gtlAvailable?.value ?? false);
let options_ltlAvailable_useDefault = $ref(role?.options?.ltlAvailable?.useDefault ?? true);
let options_ltlAvailable_value = $ref(role?.options?.ltlAvailable?.value ?? false);
let options_canPublicNote_useDefault = $ref(role?.options?.canPublicNote?.useDefault ?? true);
let options_canPublicNote_value = $ref(role?.options?.canPublicNote?.value ?? false);
let options_canInvite_useDefault = $ref(role?.options?.canInvite?.useDefault ?? true);
let options_canInvite_value = $ref(role?.options?.canInvite?.value ?? false);
let options_canManageCustomEmojis_useDefault = $ref(role?.options?.canManageCustomEmojis?.useDefault ?? true);
let options_canManageCustomEmojis_value = $ref(role?.options?.canManageCustomEmojis?.value ?? false);
let options_driveCapacityMb_useDefault = $ref(role?.options?.driveCapacityMb?.useDefault ?? true);
let options_driveCapacityMb_value = $ref(role?.options?.driveCapacityMb?.value ?? 0);
let options_pinLimit_useDefault = $ref(role?.options?.pinLimit?.useDefault ?? true);
let options_pinLimit_value = $ref(role?.options?.pinLimit?.value ?? 0);
let options_antennaLimit_useDefault = $ref(role?.options?.antennaLimit?.useDefault ?? true);
let options_antennaLimit_value = $ref(role?.options?.antennaLimit?.value ?? 0);
let options_wordMuteLimit_useDefault = $ref(role?.options?.wordMuteLimit?.useDefault ?? true);
let options_wordMuteLimit_value = $ref(role?.options?.wordMuteLimit?.value ?? 0);
let options_webhookLimit_useDefault = $ref(role?.options?.webhookLimit?.useDefault ?? true);
let options_webhookLimit_value = $ref(role?.options?.webhookLimit?.value ?? 0);
let options_clipLimit_useDefault = $ref(role?.options?.clipLimit?.useDefault ?? true);
let options_clipLimit_value = $ref(role?.options?.clipLimit?.value ?? 0);
let options_noteEachClipsLimit_useDefault = $ref(role?.options?.noteEachClipsLimit?.useDefault ?? true);
let options_noteEachClipsLimit_value = $ref(role?.options?.noteEachClipsLimit?.value ?? 0);
let options_userListLimit_useDefault = $ref(role?.options?.userListLimit?.useDefault ?? true);
let options_userListLimit_value = $ref(role?.options?.userListLimit?.value ?? 0);
let options_userEachUserListsLimit_useDefault = $ref(role?.options?.userEachUserListsLimit?.useDefault ?? true);
let options_userEachUserListsLimit_value = $ref(role?.options?.userEachUserListsLimit?.value ?? 0);

if (_DEV_) {
	watch($$(condFormula), () => {
		console.log(JSON.parse(JSON.stringify(condFormula)));
	}, { deep: true });
}

function getOptions() {
	return {
		gtlAvailable: { useDefault: options_gtlAvailable_useDefault, value: options_gtlAvailable_value },
		ltlAvailable: { useDefault: options_ltlAvailable_useDefault, value: options_ltlAvailable_value },
		canPublicNote: { useDefault: options_canPublicNote_useDefault, value: options_canPublicNote_value },
		canInvite: { useDefault: options_canInvite_useDefault, value: options_canInvite_value },
		canManageCustomEmojis: { useDefault: options_canManageCustomEmojis_useDefault, value: options_canManageCustomEmojis_value },
		driveCapacityMb: { useDefault: options_driveCapacityMb_useDefault, value: options_driveCapacityMb_value },
		pinLimit: { useDefault: options_pinLimit_useDefault, value: options_pinLimit_value },
		antennaLimit: { useDefault: options_antennaLimit_useDefault, value: options_antennaLimit_value },
		wordMuteLimit: { useDefault: options_wordMuteLimit_useDefault, value: options_wordMuteLimit_value },
		webhookLimit: { useDefault: options_webhookLimit_useDefault, value: options_webhookLimit_value },
		clipLimit: { useDefault: options_clipLimit_useDefault, value: options_clipLimit_value },
		noteEachClipsLimit: { useDefault: options_noteEachClipsLimit_useDefault, value: options_noteEachClipsLimit_value },
		userListLimit: { useDefault: options_userListLimit_useDefault, value: options_userListLimit_value },
		userEachUserListsLimit: { useDefault: options_userEachUserListsLimit_useDefault, value: options_userEachUserListsLimit_value },
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
			target,
			condFormula,
			isAdministrator: rolePermission === 'administrator',
			isModerator: rolePermission === 'moderator',
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
			target,
			condFormula,
			isAdministrator: rolePermission === 'administrator',
			isModerator: rolePermission === 'moderator',
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
