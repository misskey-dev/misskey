<template>
<div><span class="mfm-x2">{{ note.event!.title }}</span></div>
<div>Start: {{ (new Date(note.event!.start)).toLocaleString() }}</div>
<div v-if="!!note.event!.end">End: {{ (new Date(note.event!.end)).toLocaleString() }}</div>
<ul>
	<li v-for="k in Object.keys(note.event!.metadata)" :key="k">
		{{ k }}: {{ note.event!.metadata[k] }}
	</li>
</ul>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';
//import { i18n } from '@/i18n';

const props = defineProps<{
	note: misskey.entities.Note
}>();

</script>

<style lang="scss" module>
</style>
