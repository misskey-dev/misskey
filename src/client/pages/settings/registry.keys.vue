<template>
<FormBase>
	<FormGroup>
		<FormKeyValueView>
			<template #key>{{ $ts._registry.domain }}</template>
			<template #value>{{ $ts.system }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts._registry.scope }}</template>
			<template #value>{{ scope.join('/') }}</template>
		</FormKeyValueView>
	</FormGroup>
	
	<FormGroup v-if="keys">
		<template #label>{{ $ts._registry.keys }}</template>
		<FormLink v-for="key in keys" :to="`/settings/registry/value/system/${scope.join('/')}/${key[0]}`" class="_monospace">{{ key[0] }}<template #suffix>{{ key[1].toUpperCase() }}</template></FormLink>
	</FormGroup>

	<FormButton @click="createKey" primary>{{ $ts._registry.createKey }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faCogs } from '@fortawesome/free-solid-svg-icons';
import * as JSON5 from 'json5';
import MkInfo from '@client/components/ui/info.vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormSelect from '@client/components/form/select.vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

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
			[symbols.PAGE_INFO]: {
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
		this.$emit('info', this[symbols.PAGE_INFO]);
		this.fetch();
	},

	methods: {
		fetch() {
			os.api('i/registry/keys-with-type', {
				scope: this.scope
			}).then(keys => {
				this.keys = Object.entries(keys).sort((a, b) => a[0].localeCompare(b[0]));
			});
		},

		async createKey() {
			const { canceled, result } = await os.form(this.$ts._registry.createKey, {
				key: {
					type: 'string',
					label: this.$ts._registry.key,
				},
				value: {
					type: 'string',
					multiline: true,
					label: this.$ts.value,
				},
				scope: {
					type: 'string',
					label: this.$ts._registry.scope,
					default: this.scope.join('/')
				}
			});
			if (canceled) return;
			os.apiWithDialog('i/registry/set', {
				scope: result.scope.split('/'),
				key: result.key,
				value: JSON5.parse(result.value),
			}).then(() => {
				this.fetch();
			});
		}
	}
});
</script>
