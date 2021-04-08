<template>
<div>
	<XDrive ref="drive" @cd="x => folder = x"/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import XDrive from '@client/components/drive.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		XDrive
	},

	data() {
		return {
			INFO: {
				title: computed(() => this.folder ? this.folder.name : this.$ts.drive),
				icon: faCloud,
				menu: () => this.$refs.drive.getMenu()
			},
			folder: null,
		};
	},
});
</script>
