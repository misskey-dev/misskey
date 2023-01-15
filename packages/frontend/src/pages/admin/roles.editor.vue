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
		<template #label>{{ i18n.ts._role.policies }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts._role._options.rateLimitFactor }}</template>
				<template #suffix>{{ policies.rateLimitFactor.useDefault ? i18n.ts._role.useBaseValue : `${Math.floor(policies.rateLimitFactor.value * 100)}%` }} <i :class="getPriorityIcon(policies.rateLimitFactor)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.rateLimitFactor.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkRange :model-value="policies.rateLimitFactor.value * 100" :min="30" :max="300" :step="10" :text-converter="(v) => `${v}%`" @update:model-value="v => policies.rateLimitFactor.value = (v / 100)">
						<template #label>{{ i18n.ts._role._options.rateLimitFactor }}</template>
						<template #caption>{{ i18n.ts._role._options.descriptionOfRateLimitFactor }}</template>
					</MkRange>
					<MkRange v-model="policies.rateLimitFactor.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.gtlAvailable }}</template>
				<template #suffix>{{ policies.gtlAvailable.useDefault ? i18n.ts._role.useBaseValue : (policies.gtlAvailable.value ? i18n.ts.yes : i18n.ts.no) }} <i :class="getPriorityIcon(policies.gtlAvailable)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.gtlAvailable.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="policies.gtlAvailable.value" :disabled="policies.gtlAvailable.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="policies.gtlAvailable.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.ltlAvailable }}</template>
				<template #suffix>{{ policies.ltlAvailable.useDefault ? i18n.ts._role.useBaseValue : (policies.ltlAvailable.value ? i18n.ts.yes : i18n.ts.no) }} <i :class="getPriorityIcon(policies.ltlAvailable)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.ltlAvailable.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="policies.ltlAvailable.value" :disabled="policies.ltlAvailable.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="policies.ltlAvailable.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.canPublicNote }}</template>
				<template #suffix>{{ policies.canPublicNote.useDefault ? i18n.ts._role.useBaseValue : (policies.canPublicNote.value ? i18n.ts.yes : i18n.ts.no) }} <i :class="getPriorityIcon(policies.canPublicNote)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.canPublicNote.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="policies.canPublicNote.value" :disabled="policies.canPublicNote.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="policies.canPublicNote.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.canInvite }}</template>
				<template #suffix>{{ policies.canInvite.useDefault ? i18n.ts._role.useBaseValue : (policies.canInvite.value ? i18n.ts.yes : i18n.ts.no) }} <i :class="getPriorityIcon(policies.canInvite)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.canInvite.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="policies.canInvite.value" :disabled="policies.canInvite.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="policies.canInvite.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.canManageCustomEmojis }}</template>
				<template #suffix>{{ policies.canManageCustomEmojis.useDefault ? i18n.ts._role.useBaseValue : (policies.canManageCustomEmojis.value ? i18n.ts.yes : i18n.ts.no) }} <i :class="getPriorityIcon(policies.canManageCustomEmojis)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.canManageCustomEmojis.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="policies.canManageCustomEmojis.value" :disabled="policies.canManageCustomEmojis.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="policies.canManageCustomEmojis.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.driveCapacity }}</template>
				<template #suffix>{{ policies.driveCapacityMb.useDefault ? i18n.ts._role.useBaseValue : (policies.driveCapacityMb.value + 'MB') }} <i :class="getPriorityIcon(policies.driveCapacityMb)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.driveCapacityMb.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="policies.driveCapacityMb.value" :disabled="policies.driveCapacityMb.useDefault" type="number" :readonly="readonly">
						<template #suffix>MB</template>
					</MkInput>
					<MkRange v-model="policies.driveCapacityMb.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.pinMax }}</template>
				<template #suffix>{{ policies.pinLimit.useDefault ? i18n.ts._role.useBaseValue : (policies.pinLimit.value) }} <i :class="getPriorityIcon(policies.pinLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.pinLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="policies.pinLimit.value" :disabled="policies.pinLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="policies.pinLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.antennaMax }}</template>
				<template #suffix>{{ policies.antennaLimit.useDefault ? i18n.ts._role.useBaseValue : (policies.antennaLimit.value) }} <i :class="getPriorityIcon(policies.antennaLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.antennaLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="policies.antennaLimit.value" :disabled="policies.antennaLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="policies.antennaLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.wordMuteMax }}</template>
				<template #suffix>{{ policies.wordMuteLimit.useDefault ? i18n.ts._role.useBaseValue : (policies.wordMuteLimit.value) }} <i :class="getPriorityIcon(policies.wordMuteLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.wordMuteLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="policies.wordMuteLimit.value" :disabled="policies.wordMuteLimit.useDefault" type="number" :readonly="readonly">
						<template #suffix>chars</template>
					</MkInput>
					<MkRange v-model="policies.wordMuteLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.webhookMax }}</template>
				<template #suffix>{{ policies.webhookLimit.useDefault ? i18n.ts._role.useBaseValue : (policies.webhookLimit.value) }} <i :class="getPriorityIcon(policies.webhookLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.webhookLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="policies.webhookLimit.value" :disabled="policies.webhookLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="policies.webhookLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.clipMax }}</template>
				<template #suffix>{{ policies.clipLimit.useDefault ? i18n.ts._role.useBaseValue : (policies.clipLimit.value) }} <i :class="getPriorityIcon(policies.clipLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.clipLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="policies.clipLimit.value" :disabled="policies.clipLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="policies.clipLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.noteEachClipsMax }}</template>
				<template #suffix>{{ policies.noteEachClipsLimit.useDefault ? i18n.ts._role.useBaseValue : (policies.noteEachClipsLimit.value) }} <i :class="getPriorityIcon(policies.noteEachClipsLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.noteEachClipsLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="policies.noteEachClipsLimit.value" :disabled="policies.noteEachClipsLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="policies.noteEachClipsLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.userListMax }}</template>
				<template #suffix>{{ policies.userListLimit.useDefault ? i18n.ts._role.useBaseValue : (policies.userListLimit.value) }} <i :class="getPriorityIcon(policies.userListLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.userListLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="policies.userListLimit.value" :disabled="policies.userListLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="policies.userListLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.userEachUserListsMax }}</template>
				<template #suffix>{{ policies.userEachUserListsLimit.useDefault ? i18n.ts._role.useBaseValue : (policies.userEachUserListsLimit.value) }} <i :class="getPriorityIcon(policies.userEachUserListsLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="policies.userEachUserListsLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="policies.userEachUserListsLimit.value" :disabled="policies.userEachUserListsLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="policies.userEachUserListsLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
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
import { computed, reactive, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import RolesEditorFormula from './RolesEditorFormula.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import MkRange from '@/components/MkRange.vue';
import FormSlot from '@/components/form/slot.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { instance } from '@/instance';

const ROLE_POLICIES = [
	'gtlAvailable',
	'ltlAvailable',
	'canPublicNote',
	'canInvite',
	'canManageCustomEmojis',
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

const policies = reactive<Record<typeof ROLE_POLICIES[number], { useDefault: boolean; priority: number; value: any; }>>({});
for (const ROLE_POLICY of ROLE_POLICIES) {
	const _policies = role?.policies ?? {};
	policies[ROLE_POLICY] = {
		useDefault: _policies[ROLE_POLICY]?.useDefault ?? true,
		priority: _policies[ROLE_POLICY]?.priority ?? 0,
		value: _policies[ROLE_POLICY]?.value ?? instance.policies[ROLE_POLICY],
	};
}

if (_DEV_) {
	watch($$(condFormula), () => {
		console.log(JSON.parse(JSON.stringify(condFormula)));
	}, { deep: true });
}

function getPriorityIcon(option) {
	if (option.priority === 2) return 'ti ti-arrows-up';
	if (option.priority === 1) return 'ti ti-arrow-narrow-up';
	return 'ti ti-point';
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
			policies,
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
			policies,
		});
		emit('created', created);
	}
}
</script>

<style lang="scss" module>

</style>
