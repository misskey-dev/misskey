<template>
<FormBase>
	<FormLink to="/settings/plugin/install"><template #icon><i class="fas fa-download"></i></template>{{ $ts._plugin.install }}</FormLink>
	<FormLink to="/settings/plugin/manage"><template #icon><i class="fas fa-folder-open"></i></template>{{ $ts._plugin.manage }}<template #suffix>{{ plugins }}</template></FormLink>
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
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormLink,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.plugins,
				icon: faPlug
			},
			plugins: ColdDeviceStorage.get('plugins').length,
			faPlug, faSave, faTrashAlt, faFolderOpen, faDownload, faCog
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},
});
</script>

<style lang="scss" scoped>

</style>
