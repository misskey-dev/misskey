<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:with-ok-button="true"
	:ok-button-disabled="false"
	@ok="ok()"
	@close="dialog.close()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.describeFile }}</template>
	<MkSpacer :margin-min="20" :margin-max="28">
		<MkDriveFileThumbnail :file="file" fit="contain" style="height: 100px; margin-bottom: 16px;"/>
		<MkTextarea v-model="caption" autofocus :placeholder="i18n.ts.inputNewDescription">
			<template #label>{{ i18n.ts.caption }}</template>
		</MkTextarea>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	file: Misskey.entities.DriveFile;
	default: string;
}>();

const emit = defineEmits<{
	(ev: 'done', v: string): void;
	(ev: 'closed'): void;
}>();

const dialog = $shallowRef<InstanceType<typeof MkModalWindow>>();

let caption = $ref(props.default);

async function ok() {
	emit('done', caption);
	dialog.close();
}
</script>
