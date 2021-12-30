<template>
<div>
	<XDrive ref="drive" @cd="x => folder = x"/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import XDrive from '@/components/drive.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		XDrive
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: computed(() => this.folder ? this.folder.name : this.$ts.drive),
				icon: 'fas fa-cloud',
				bg: 'var(--bg)',
				hideHeader: true,
			},
			folder: null,
		};
	},
});
</script>
