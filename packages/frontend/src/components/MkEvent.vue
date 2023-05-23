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
		<template v-if="note.event!.metadata.doorTime">
			<dt :class="$style.key">{{ "Door Time" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.doorTime }}</dd>
		</template>
		<template v-if="note.event!.metadata.location">
			<dt :class="$style.key">{{ "Location" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.location }}</dd>
		</template>
		<template v-if="note.event!.metadata.url">
			<dt :class="$style.key">{{ "URL" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.url }}</dd>
		</template>
		<template v-if="note.event!.metadata.organizer">
			<dt :class="$style.key">{{ "Organizer" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.organizer.name }}</dd>
		</template>
		<template v-if="note.event!.metadata.audience">
			<dt :class="$style.key">{{ "Audience" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.audience.name }}</dd>
		</template>
		<template v-if="note.event!.metadata.inLanguage">
			<dt :class="$style.key">{{ "Language" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.inLanguage }}</dd>
		</template>
		<template v-if="note.event!.metadata.typicalAgeRange">
			<dt :class="$style.key">{{ "Ages" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.typicalAgeRange }}</dd>
		</template>
		<template v-if="note.event!.metadata.performer">
			<dt :class="$style.key">{{ "Performers" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.performer.join(', ') }}</dd>
		</template>
		<template v-if="note.event!.metadata.offers?.url">
			<dt :class="$style.key">{{ "Tickets" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.url }}</dd>
		</template>
		<template v-if="note.event!.metadata.isAccessibleForFree">
			<dt :class="$style.key">{{ "Free" }}</dt> 
			<dd :class="$style.value">{{ "Yes" }}</dd>
		</template>
		<template v-if="note.event!.metadata.offers?.price">
			<dt :class="$style.key">{{ "Price" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.offers.price }}</dd>
		</template>
		<template v-if="note.event!.metadata.offers?.url">
			<dt :class="$style.key">{{ "Tickets Available" }}</dt> 
			<dd :class="$style.value">
				{{ [
					(note.event!.metadata.offers.availabilityStarts ? 'From ' + note.event!.metadata.offers.availabilityStarts : ''), 
					(note.event!.metadata.offers.availabilityEnds ? 'Until ' + note.event!.metadata.offers.availabilityEnds : '')]
					.join(' ') }}
			</dd>
		</template>
		<template v-if="note.event!.metadata.offers?.url">
			<dt :class="$style.key">{{ "Tickets" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.url }}</dd>
		</template>
		<template v-if="note.event!.metadata.keywords">
			<dt :class="$style.key">{{ "Keywords" }}</dt> 
			<dd :class="$style.value">{{ note.event!.metadata.keywords }}</dd>
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
