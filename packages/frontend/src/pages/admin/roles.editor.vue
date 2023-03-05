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

	<MkInput v-model="iconUrl">
		<template #label>{{ i18n.ts._role.iconUrl }}</template>
	</MkInput>

	<MkSelect v-model="rolePermission" :readonly="readonly">
		<template #label><i class="ti ti-shield-lock"></i> {{ i18n.ts._role.permission }}</template>
		<template #caption><div v-html="i18n.ts._role.descriptionOfPermission.replaceAll('\n', '<br>')"></div></template>
		<option value="normal">{{ i18n.ts.normalUser }}</option>
		<option value="moderator">{{ i18n.ts.moderator }}</option>
		<option value="administrator">{{ i18n.ts.administrator }}</option>
	</MkSelect>

	<MkSelect v-model="target" :readonly="readonly">
		<template #label><i class="ti ti-users"></i> {{ i18n.ts._role.assignTarget }}</template>
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

	<MkSwitch v-model="canEditMembersByModerator" :readonly="readonly">
		<template #label>{{ i18n.ts._role.canEditMembersByModerator }}</template>
		<template #caption>{{ i18n.ts._role.descriptionOfCanEditMembersByModerator }}</template>
	</MkSwitch>

	<MkSwitch v-model="isPublic" :readonly="readonly">
		<template #label>{{ i18n.ts._role.isPublic }}</template>
		<template #caption>{{ i18n.ts._role.descriptionOfIsPublic }}</template>
	</MkSwitch>

	<MkSwitch v-model="asBadge" :readonly="readonly">
		<template #label>{{ i18n.ts._role.asBadge }}</template>
		<template #caption>{{ i18n.ts._role.descriptionOfAsBadge }}</template>
	</MkSwitch>

	<FormSlot>
		<template #label><i class="ti ti-license"></i> {{ i18n.ts._role.policies }}</template>
		<div class="_gaps_s">
			<MkInput v-model="q" type="search">
				<template #prefix><i class="ti ti-search"></i></template>
			</MkInput>

			<MkFolder v-if="matchQuery([i18n.ts._role._options.rateLimitFactor, 'rateLimitFactor'])">
				<template #label>{{ i18n.ts._role._options.rateLimitFactor }}</template>
				<template #suffix>
					<span v-if="policies.rateLimitFactor.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ `${Math.floor(policies.rateLimitFactor.value * 100)}%` }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.rateLimitFactor)"></i></span>
				</template>
				<div class="_gaps">
					<MkSwitch v-model="policies.rateLimitFactor.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkRange :model-value="policies.rateLimitFactor.value * 100" :min="0" :max="400" :step="10" :text-converter="(v) => `${v}%`" @update:model-value="v => policies.rateLimitFactor.value = (v / 100)">
						<template #label>{{ i18n.ts._role._options.rateLimitFactor }}</template>
						<template #caption>{{ i18n.ts._role._options.descriptionOfRateLimitFactor }}</template>
					</MkRange>
					<MkRange v-model="policies.rateLimitFactor.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>

			<MkFolder v-if="matchQuery([i18n.ts._role._options.gtlAvailable, 'gtlAvailable'])">
				<template #label>{{ i18n.ts._role._options.gtlAvailable }}</template>
				<template #suffix>
					<span v-if="policies.gtlAvailable.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.gtlAvailable.value ? i18n.ts.yes : i18n.ts.no }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.gtlAvailable)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.ltlAvailable, 'ltlAvailable'])">
				<template #label>{{ i18n.ts._role._options.ltlAvailable }}</template>
				<template #suffix>
					<span v-if="policies.ltlAvailable.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.ltlAvailable.value ? i18n.ts.yes : i18n.ts.no }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.ltlAvailable)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.canPublicNote, 'canPublicNote'])">
				<template #label>{{ i18n.ts._role._options.canPublicNote }}</template>
				<template #suffix>
					<span v-if="policies.canPublicNote.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.canPublicNote.value ? i18n.ts.yes : i18n.ts.no }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.canPublicNote)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.canInvite, 'canInvite'])">
				<template #label>{{ i18n.ts._role._options.canInvite }}</template>
				<template #suffix>
					<span v-if="policies.canInvite.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.canInvite.value ? i18n.ts.yes : i18n.ts.no }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.canInvite)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.canManageCustomEmojis, 'canManageCustomEmojis'])">
				<template #label>{{ i18n.ts._role._options.canManageCustomEmojis }}</template>
				<template #suffix>
					<span v-if="policies.canManageCustomEmojis.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.canManageCustomEmojis.value ? i18n.ts.yes : i18n.ts.no }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.canManageCustomEmojis)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.driveCapacity, 'driveCapacityMb'])">
				<template #label>{{ i18n.ts._role._options.driveCapacity }}</template>
				<template #suffix>
					<span v-if="policies.driveCapacityMb.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.driveCapacityMb.value + 'MB' }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.driveCapacityMb)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.pinMax, 'pinLimit'])">
				<template #label>{{ i18n.ts._role._options.pinMax }}</template>
				<template #suffix>
					<span v-if="policies.pinLimit.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.pinLimit.value }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.pinLimit)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.antennaMax, 'antennaLimit'])">
				<template #label>{{ i18n.ts._role._options.antennaMax }}</template>
				<template #suffix>
					<span v-if="policies.antennaLimit.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.antennaLimit.value }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.antennaLimit)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.wordMuteMax, 'wordMuteLimit'])">
				<template #label>{{ i18n.ts._role._options.wordMuteMax }}</template>
				<template #suffix>
					<span v-if="policies.wordMuteLimit.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.wordMuteLimit.value }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.wordMuteLimit)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.webhookMax, 'webhookLimit'])">
				<template #label>{{ i18n.ts._role._options.webhookMax }}</template>
				<template #suffix>
					<span v-if="policies.webhookLimit.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.webhookLimit.value }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.webhookLimit)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.clipMax, 'clipLimit'])">
				<template #label>{{ i18n.ts._role._options.clipMax }}</template>
				<template #suffix>
					<span v-if="policies.clipLimit.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.clipLimit.value }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.clipLimit)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.noteEachClipsMax, 'noteEachClipsLimit'])">
				<template #label>{{ i18n.ts._role._options.noteEachClipsMax }}</template>
				<template #suffix>
					<span v-if="policies.noteEachClipsLimit.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.noteEachClipsLimit.value }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.noteEachClipsLimit)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.userListMax, 'userListLimit'])">
				<template #label>{{ i18n.ts._role._options.userListMax }}</template>
				<template #suffix>
					<span v-if="policies.userListLimit.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.userListLimit.value }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.userListLimit)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.userEachUserListsMax, 'userEachUserListsLimit'])">
				<template #label>{{ i18n.ts._role._options.userEachUserListsMax }}</template>
				<template #suffix>
					<span v-if="policies.userEachUserListsLimit.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.userEachUserListsLimit.value }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.userEachUserListsLimit)"></i></span>
				</template>
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

			<MkFolder v-if="matchQuery([i18n.ts._role._options.canHideAds, 'canHideAds'])">
				<template #label>{{ i18n.ts._role._options.canHideAds }}</template>
				<template #suffix>
					<span v-if="policies.canHideAds.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
					<span v-else>{{ policies.canHideAds.value ? i18n.ts.yes : i18n.ts.no }}</span>
					<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policies.canHideAds)"></i></span>
				</template>
				<div class="_gaps">
					<MkSwitch v-model="policies.canHideAds.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts._role.useBaseValue }}</template>
					</MkSwitch>
					<MkSwitch v-model="policies.canHideAds.value" :disabled="policies.canHideAds.useDefault" :readonly="readonly">
						<template #label>{{ i18n.ts.enable }}</template>
					</MkSwitch>
					<MkRange v-model="policies.canHideAds.priority" :min="0" :max="2" :step="1" easing :text-converter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''">
						<template #label>{{ i18n.ts._role.priority }}</template>
					</MkRange>
				</div>
			</MkFolder>
		</div>
	</FormSlot>

	<div v-if="!readonly" class="_buttons">
		<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ role ? i18n.ts.save : i18n.ts.create }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue';
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

const emit = defineEmits<{
	(ev: 'created', payload: any): void;
	(ev: 'updated'): void;
}>();

const props = defineProps<{
	role?: any;
	readonly?: boolean;
}>();

const role = props.role;
let q = $ref('');

let name = $ref(role?.name ?? 'New Role');
let description = $ref(role?.description ?? '');
let rolePermission = $ref(role?.isAdministrator ? 'administrator' : role?.isModerator ? 'moderator' : 'normal');
let color = $ref(role?.color ?? null);
let iconUrl = $ref(role?.iconUrl ?? null);
let target = $ref(role?.target ?? 'manual');
let condFormula = $ref(role?.condFormula ?? { id: uuid(), type: 'isRemote' });
let isPublic = $ref(role?.isPublic ?? false);
let asBadge = $ref(role?.asBadge ?? false);
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

function matchQuery(keywords: string[]): boolean {
	if (q.trim().length === 0) return true;
	return keywords.some(keyword => keyword.toLowerCase().includes(q.toLowerCase()));
}

async function save() {
	if (props.readonly) return;
	if (role) {
		os.apiWithDialog('admin/roles/update', {
			roleId: role.id,
			name,
			description,
			color: color === '' ? null : color,
			iconUrl: iconUrl === '' ? null : iconUrl,
			target,
			condFormula,
			isAdministrator: rolePermission === 'administrator',
			isModerator: rolePermission === 'moderator',
			isPublic,
			asBadge,
			canEditMembersByModerator,
			policies,
		});
		emit('updated');
	} else {
		const created = await os.apiWithDialog('admin/roles/create', {
			name,
			description,
			color: color === '' ? null : color,
			iconUrl: iconUrl === '' ? null : iconUrl,
			target,
			condFormula,
			isAdministrator: rolePermission === 'administrator',
			isModerator: rolePermission === 'moderator',
			isPublic,
			asBadge,
			canEditMembersByModerator,
			policies,
		});
		emit('created', created);
	}
}
</script>

<style lang="scss" module>
.useDefaultLabel {
	opacity: 0.7;
}

.priorityIndicator {
	margin-left: 8px;
}
</style>
