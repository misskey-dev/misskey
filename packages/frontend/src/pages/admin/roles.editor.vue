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
				<template #label>{{ i18n.ts._role._options.rateLimitFactor }}</template>
				<template #suffix>{{ options.rateLimitFactor.useDefault ? i18n.ts._role.useBaseValue : `${Math.floor(options.rateLimitFactor.value * 100)}%` }} <i :class="getPriorityIcon(options.rateLimitFactor)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.rateLimitFactor.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkRange :model-value="options.rateLimitFactor.value * 100" :min="30" :max="300" :step="10" :text-converter="(v) => `${v}%`" @update:model-value="v => options.rateLimitFactor.value = (v / 100)">
						<template #label>{{ i18n.ts._role._options.rateLimitFactor }}</template>
						<template #caption>{{ i18n.ts._role._options.descriptionOfRateLimitFactor }}</template>
					</MkRange>
					<MkRange v-model="options.rateLimitFactor.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.gtlAvailable }}</template>
				<template #suffix>{{ options.gtlAvailable.useDefault ? i18n.ts._role.useBaseValue : (options.gtlAvailable.value ? i18n.ts.yes : i18n.ts.no) }} <i :class="getPriorityIcon(options.gtlAvailable)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.gtlAvailable.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="options.gtlAvailable.value" :disabled="options.gtlAvailable.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="options.gtlAvailable.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.ltlAvailable }}</template>
				<template #suffix>{{ options.ltlAvailable.useDefault ? i18n.ts._role.useBaseValue : (options.ltlAvailable.value ? i18n.ts.yes : i18n.ts.no) }} <i :class="getPriorityIcon(options.ltlAvailable)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.ltlAvailable.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="options.ltlAvailable.value" :disabled="options.ltlAvailable.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="options.ltlAvailable.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.canPublicNote }}</template>
				<template #suffix>{{ options.canPublicNote.useDefault ? i18n.ts._role.useBaseValue : (options.canPublicNote.value ? i18n.ts.yes : i18n.ts.no) }} <i :class="getPriorityIcon(options.canPublicNote)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.canPublicNote.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="options.canPublicNote.value" :disabled="options.canPublicNote.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="options.canPublicNote.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.canInvite }}</template>
				<template #suffix>{{ options.canInvite.useDefault ? i18n.ts._role.useBaseValue : (options.canInvite.value ? i18n.ts.yes : i18n.ts.no) }} <i :class="getPriorityIcon(options.canInvite)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.canInvite.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="options.canInvite.value" :disabled="options.canInvite.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="options.canInvite.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.canManageCustomEmojis }}</template>
				<template #suffix>{{ options.canManageCustomEmojis.useDefault ? i18n.ts._role.useBaseValue : (options.canManageCustomEmojis.value ? i18n.ts.yes : i18n.ts.no) }} <i :class="getPriorityIcon(options.canManageCustomEmojis)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.canManageCustomEmojis.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="options.canManageCustomEmojis.value" :disabled="options.canManageCustomEmojis.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="options.canManageCustomEmojis.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.driveCapacity }}</template>
				<template #suffix>{{ options.driveCapacityMb.useDefault ? i18n.ts._role.useBaseValue : (options.driveCapacityMb.value + 'MB') }} <i :class="getPriorityIcon(options.driveCapacityMb)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.driveCapacityMb.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options.driveCapacityMb.value" :disabled="options.driveCapacityMb.useDefault" type="number" :readonly="readonly">
						<template #suffix>MB</template>
					</MkInput>
					<MkRange v-model="options.driveCapacityMb.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.pinMax }}</template>
				<template #suffix>{{ options.pinLimit.useDefault ? i18n.ts._role.useBaseValue : (options.pinLimit.value) }} <i :class="getPriorityIcon(options.pinLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.pinLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options.pinLimit.value" :disabled="options.pinLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="options.pinLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.antennaMax }}</template>
				<template #suffix>{{ options.antennaLimit.useDefault ? i18n.ts._role.useBaseValue : (options.antennaLimit.value) }} <i :class="getPriorityIcon(options.antennaLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.antennaLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options.antennaLimit.value" :disabled="options.antennaLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="options.antennaLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.wordMuteMax }}</template>
				<template #suffix>{{ options.wordMuteLimit.useDefault ? i18n.ts._role.useBaseValue : (options.wordMuteLimit.value) }} <i :class="getPriorityIcon(options.wordMuteLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.wordMuteLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options.wordMuteLimit.value" :disabled="options.wordMuteLimit.useDefault" type="number" :readonly="readonly">
						<template #suffix>chars</template>
					</MkInput>
					<MkRange v-model="options.wordMuteLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.webhookMax }}</template>
				<template #suffix>{{ options.webhookLimit.useDefault ? i18n.ts._role.useBaseValue : (options.webhookLimit.value) }} <i :class="getPriorityIcon(options.webhookLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.webhookLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options.webhookLimit.value" :disabled="options.webhookLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="options.webhookLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.clipMax }}</template>
				<template #suffix>{{ options.clipLimit.useDefault ? i18n.ts._role.useBaseValue : (options.clipLimit.value) }} <i :class="getPriorityIcon(options.clipLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.clipLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options.clipLimit.value" :disabled="options.clipLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="options.clipLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.noteEachClipsMax }}</template>
				<template #suffix>{{ options.noteEachClipsLimit.useDefault ? i18n.ts._role.useBaseValue : (options.noteEachClipsLimit.value) }} <i :class="getPriorityIcon(options.noteEachClipsLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.noteEachClipsLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options.noteEachClipsLimit.value" :disabled="options.noteEachClipsLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="options.noteEachClipsLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.userListMax }}</template>
				<template #suffix>{{ options.userListLimit.useDefault ? i18n.ts._role.useBaseValue : (options.userListLimit.value) }} <i :class="getPriorityIcon(options.userListLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.userListLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options.userListLimit.value" :disabled="options.userListLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="options.userListLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._role._options.userEachUserListsMax }}</template>
				<template #suffix>{{ options.userEachUserListsLimit.useDefault ? i18n.ts._role.useBaseValue : (options.userEachUserListsLimit.value) }} <i :class="getPriorityIcon(options.userEachUserListsLimit)"></i></template>
				<div class="_gaps">
					<MkSwitch v-model="options.userEachUserListsLimit.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkInput v-model="options.userEachUserListsLimit.value" :disabled="options.userEachUserListsLimit.useDefault" type="number" :readonly="readonly">
					</MkInput>
					<MkRange v-model="options.userEachUserListsLimit.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
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

const ROLE_OPTIONS = [
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

const options = reactive<Record<typeof ROLE_OPTIONS[number], { useDefault: boolean; priority: number; value: any; }>>({});
for (const ROLE_OPTION of ROLE_OPTIONS) {
	const _options = role?.options ?? {};
	options[ROLE_OPTION] = {
		useDefault: _options[ROLE_OPTION]?.useDefault ?? true,
		priority: _options[ROLE_OPTION]?.priority ?? 0,
		value: _options[ROLE_OPTION]?.value ?? instance.baseRole[ROLE_OPTION],
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
			options,
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
			options,
		});
		emit('created', created);
	}
}
</script>

<style lang="scss" module>

</style>
