<template>
<div>
	<XDrive ref="drive" @cd="x => folder = x"/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faCloud, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
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
				action: {
					icon: faEllipsisH,
					handler: this.menu
				}
			},
			folder: null,
		};
	},

	methods: {
		menu(ev) {
			os.modalMenu(this.$refs.drive.getMenu(), ev.currentTarget || ev.target);
		}
	}
});
</script>
