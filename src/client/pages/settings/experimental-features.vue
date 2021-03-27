<template>
<FormBase>
	<FormButton @click="error()">error test</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@client/components/form/switch.vue';
import FormSelect from '@client/components/form/select.vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		FormBase,
		FormSelect,
		FormSwitch,
		FormButton,
		FormLink,
		FormGroup,
		FormKeyValueView,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$ts.experimentalFeatures,
				icon: faFlask
			},
			stats: null
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		error() {
			throw new Error('Test error');
		}
	}
});
</script>
