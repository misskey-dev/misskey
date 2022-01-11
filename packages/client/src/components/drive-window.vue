<template>
<XWindow ref="window"
	:initial-width="800"
	:initial-height="500"
	:can-resize="true"
	@closed="$emit('closed')"
>
	<template #header>
		{{ $ts.drive }}
	</template>
	<XDrive :initial-folder="initialFolder"/>
</XWindow>
</template>

<script lang="ts" setup>
import {  } from 'vue';
import * as Misskey from 'misskey-js';
import XDrive from './drive.vue';
import XWindow from '@/components/ui/window.vue';

defineProps<{
	initialFolder?: Misskey.entities.DriveFolder;
}>();

defineEmits<{
	(e: 'closed'): void;
}>();
</script>
