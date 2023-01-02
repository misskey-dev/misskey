<template>
<XWindow
	ref="window"
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
import { } from 'vue';
import * as Misskey from 'misskey-js';
import XDrive from '@/components/MkDrive.vue';
import XWindow from '@/components/MkWindow.vue';
import { i18n } from '@/i18n';

defineProps<{
	initialFolder?: Misskey.entities.DriveFolder;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>
