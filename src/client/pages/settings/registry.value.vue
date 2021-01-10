<template>
<FormBase>
	<MkInfo warn>{{ $ts.editTheseSettingsMayBreakAccount }}</MkInfo>

	<FormGroup v-if="value">
		<FormTextarea tall :value="value">
			<span>{{ $ts.value }}</span>
		</FormTextarea>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faCogs } from '@fortawesome/free-solid-svg-icons';
import MkInfo from '@/components/ui/info.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormButton from '@/components/form/button.vue';
import FormKeyValueView from '@/components/form/key-value-view.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkInfo,
		FormBase,
		FormSelect,
		FormSwitch,
		FormButton,
		FormTextarea,
		FormGroup,
		FormKeyValueView,
	},

	props: {
		scope: {
			required: true
		},
		xKey: {
			required: true
		},
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$ts.registry,
				icon: faCogs
			},
			value: null,
		}
	},

	watch: {
		key() {
			this.fetch();
		},
	},

	mounted() {
		this.$emit('info', this.INFO);
		this.fetch();
	},

	methods: {
		fetch() {
			os.api('i/registry/get', {
				scope: this.scope,
				key: this.xKey
			}).then(value => {
				this.value = JSON.stringify(value, null, '\t');
			});
		},
	}
});
</script>
