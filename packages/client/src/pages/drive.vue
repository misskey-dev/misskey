<template>
<div>
	<XDrive ref="drive" @cd="x => folder = x"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XDrive from '@/components/drive.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

let folder = $ref(null);

defineExpose({
	[symbols.PAGE_INFO]: computed(() => ({
		title: folder ? folder.name : i18n.ts.drive,
		icon: 'fas fa-cloud',
		bg: 'var(--bg)',
		hideHeader: true,
	})),
});
</script>
