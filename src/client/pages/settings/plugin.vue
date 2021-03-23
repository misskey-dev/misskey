<template>
<FormBase>
	<FormLink to="/settings/plugin/install"><template #icon><Fa :icon="faDownload"/></template>{{ $ts._plugin.install }}</FormLink>
	<FormLink to="/settings/plugin/manage"><template #icon><Fa :icon="faFolderOpen"/></template>{{ $ts._plugin.manage }}<template #suffix>{{ plugins }}</template></FormLink>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlug, faSave, faTrashAlt, faFolderOpen, faDownload, faCog } from '@fortawesome/free-solid-svg-icons';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormLink from '@client/components/form/link.vue';
import * as os from '@client/os';
import { ColdDeviceStorage } from '@client/store';

export default defineComponent({
	components: {
		FormBase,
		FormLink,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$ts.plugins,
				icon: faPlug
			},
			plugins: ColdDeviceStorage.get('plugins').length,
			faPlug, faSave, faTrashAlt, faFolderOpen, faDownload, faCog
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},
});
</script>

<style lang="scss" scoped>

</style>
