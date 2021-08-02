<template>
<div>
	<XDrive ref="drive" @cd="x => folder = x"/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import XDrive from '@client/components/drive.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XDrive
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: computed(() => this.folder ? this.folder.name : this.$ts.drive),
				icon: 'fas fa-cloud',
			},
			folder: null,
		};
	},
});
</script>
