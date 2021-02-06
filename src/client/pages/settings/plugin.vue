<template>
<FormBase>
	<FormLink to="/settings/plugin/install"><template #icon><Fa :icon="faDownload"/></template>{{ $ts._plugin.install }}</FormLink>
	<FormLink to="/settings/plugin/manage"><template #icon><Fa :icon="faFolderOpen"/></template>{{ $ts._plugin.manage }}</FormLink>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlug, faSave, faTrashAlt, faFolderOpen, faDownload, faCog } from '@fortawesome/free-solid-svg-icons';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormLink from '@/components/form/link.vue';
import * as os from '@/os';

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
