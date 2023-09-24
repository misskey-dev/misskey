<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #label>{{ i18n.ts._moderationLogTypes[log.type] }}</template>
	<template #icon>
		<MkAvatar :user="log.user" :class="$style.avatar"/>
	</template>
	<template #suffix>
		<MkTime :time="log.createdAt" mode="detail"/>
	</template>

	<div :class="$style.root">
		<div>{{ i18n.ts.moderator }}: {{ log.userId }}</div>

		<template v-if="log.type === 'updateServerSettings'">
			<div :class="$style.diff">
				<CodeDiff :oldString="JSON5.stringify(log.info.before, null, '\t')" :newString="JSON5.stringify(log.info.after, null, '\t')" language="javascript" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'updateUserNote'">
			<div>{{ i18n.ts.user }}: {{ log.info.userId }}</div>
			<div :class="$style.diff">
				<CodeDiff :oldString="log.info.before ?? ''" :newString="log.info.after ?? ''" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'suspend'">
			<div>{{ i18n.ts.user }}: {{ log.info.targetId }}</div>
		</template>
		<template v-else-if="log.type === 'unsuspend'">
			<div>{{ i18n.ts.user }}: {{ log.info.targetId }}</div>
		</template>
		<template v-else-if="log.type === 'assignRole'">
			<div>{{ i18n.ts.user }}: {{ log.info.userId }}</div>
			<div>{{ i18n.ts.role }}: {{ log.info.roleName }} [{{ log.info.roleId }}]</div>
		</template>
		<template v-else-if="log.type === 'unassignRole'">
			<div>{{ i18n.ts.user }}: {{ log.info.userId }}</div>
			<div>{{ i18n.ts.role }}: {{ log.info.roleName }} [{{ log.info.roleId }}]</div>
		</template>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { CodeDiff } from 'v-code-diff';
import JSON5 from 'json5';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { dateString } from '@/filters/date.js';
import MkFolder from '@/components/MkFolder.vue';

const props = defineProps<{
	log: Misskey.entities.ModerationLog;
}>();
</script>

<style lang="scss" module>
.root {
}

.avatar {
	width: 18px;
	height: 18px;
}

.diff {
	background: #fff;
	color: #000;
	border-radius: 6px;
	overflow: clip;
}
</style>
