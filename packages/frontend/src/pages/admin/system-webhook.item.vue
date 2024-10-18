<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #label>{{ entity.name || entity.url }}</template>
	<template v-if="entity.name != null && entity.name != ''" #caption>{{ entity.url }}</template>
	<template #icon>
		<i v-if="!entity.isActive" class="ti ti-player-pause"/>
		<i v-else-if="entity.latestStatus === null" class="ti ti-circle"/>
		<i
			v-else-if="[200, 201, 204].includes(entity.latestStatus)"
			class="ti ti-check"
			:style="{ color: 'var(--MI_THEME-success)' }"
		/>
		<i v-else class="ti ti-alert-triangle" :style="{ color: 'var(--MI_THEME-error)' }"/>
	</template>
	<template #suffix>
		<MkTime v-if="entity.latestSentAt" :time="entity.latestSentAt" style="margin-right: 8px"/>
		<span v-else>-</span>
	</template>
	<template #footer>
		<div class="_buttons">
			<MkButton @click="onEditClick">
				<i class="ti ti-settings"></i> {{ i18n.ts.edit }}
			</MkButton>
			<MkButton danger @click="onDeleteClick">
				<i class="ti ti-trash"></i> {{ i18n.ts.delete }}
			</MkButton>
		</div>
	</template>

	<div class="_gaps">
		<MkKeyValue>
			<template #key>latestStatus</template>
			<template #value>{{ entity.latestStatus ?? '-' }}</template>
		</MkKeyValue>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { entities } from 'misskey-js';
import { toRefs } from 'vue';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';

const emit = defineEmits<{
	(ev: 'edit', value: entities.SystemWebhook): void;
	(ev: 'delete', value: entities.SystemWebhook): void;
}>();

const props = defineProps<{
	entity: entities.SystemWebhook;
}>();

const { entity } = toRefs(props);

function onEditClick() {
	emit('edit', entity.value);
}

function onDeleteClick() {
	emit('delete', entity.value);
}

</script>

<style module lang="scss">
.icon {
	margin-right: 0.75em;
	flex-shrink: 0;
	text-align: center;
	color: var(--MI_THEME-fgTransparentWeak);
}
</style>
