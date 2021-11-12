<template>
<FormBase>
	<FormButton @click="error()">error test</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormKeyValueView from '@/components/debobigego/key-value-view.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

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
			[symbols.PAGE_INFO]: {
				title: this.$ts.experimentalFeatures,
				icon: 'fas fa-flask'
			},
			stats: null
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		error() {
			throw new Error('Test error');
		}
	}
});
</script>
