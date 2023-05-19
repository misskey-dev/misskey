<template>
<div :class="$style.container">
	<div :class="$style.title">
		<i class="ti ti-calendar-event icon"></i>
		{{ note.event!.title }}
	</div>
	<dl :class="$style.details">
		<dt :class="$style.key">{{ i18n.ts._event.startDateTime }}</dt>
		<dd :class="$style.value">
			<MkTime :time="note.event!.start" mode="detail"/>
		</dd>
		<template v-if="note.event!.end">
			<dt :class="$style.key">{{ i18n.ts._event.endDateTime }}</dt>
			<dd :class="$style.value">
				<MkTime :time="note.event!.end" mode="detail"/>
			</dd>
		</template>
		<template v-for="[key, value] of Object.entries(note.event!.detail)" :key="key">
			<dt :class="$style.key">{{ key }}</dt>
			<dd :class="$style.value">{{ value }}</dd>
		</template>
	</dl>
</div>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';
import { i18n } from '@/i18n';

const props = defineProps<{
	note: misskey.entities.Note
}>();
</script>

<style lang="scss" module>
.container {
	background: var(--bg);
	border-radius: var(--radius);
	padding: 1rem;
}

.title {
	font-size: 1.6rem;
	line-height: 1.25;
	font-weight: bold;
	padding-bottom: 1rem;
	border-bottom: .5px solid var(--divider);
}

.details {
	display: grid;
	grid-template-columns: auto 1fr;
	grid-gap: 1rem;
	padding-top: 1rem;
	margin: 0;
}

.key {
	opacity: 0.75;
}

.value {
	margin: 0;
	opacity: 0.75;
}
</style>
