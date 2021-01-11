<template>
<FormBase>
	<FormGroup>
		<FormKeyValueView>
			<template #key>{{ $ts.domain }}</template>
			<template #value>{{ $ts.system }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.scope }}</template>
			<template #value>{{ scope.join('/') }}</template>
		</FormKeyValueView>
	</FormGroup>
	
	<FormGroup v-if="keys">
		<template #label>{{ $ts.keys }}</template>
		<FormLink v-for="key in keys" :to="`/settings/registry/value/system/${scope.join('/')}/${key}`">{{ key }}</FormLink>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faCogs } from '@fortawesome/free-solid-svg-icons';
import MkInfo from '@/components/ui/info.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormLink from '@/components/form/link.vue';
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
		FormLink,
		FormGroup,
		FormKeyValueView,
	},

	props: {
		scope: {
			required: true
		}
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$ts.registry,
				icon: faCogs
			},
			keys: null,
		}
	},

	watch: {
		scope() {
			this.fetch();
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
		this.fetch();
	},

	methods: {
		fetch() {
			os.api('i/registry/keys', {
				scope: this.scope
			}).then(keys => {
				this.keys = keys;
			});
		}
	}
});
</script>
