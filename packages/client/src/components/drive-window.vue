<template>
<XWindow ref="window"
	:initial-width="800"
	:initial-height="500"
	:can-resize="true"
	@closed="emit('closed')"
>
	<template #header>
		{{ i18n.ts.drive }}
	</template>
	<XDrive :initial-folder="initialFolder"/>
</XWindow>
</template>

<script lang="ts" setup>
import {  } from 'vue';
import * as Misskey from 'misskey-js';
import XDrive from './drive.vue';
import XWindow from '@/components/ui/window.vue';
import { i18n } from '@/i18n';

defineProps<{
	initialFolder?: Misskey.entities.DriveFolder;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>
