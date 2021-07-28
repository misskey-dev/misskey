<template>
<FormBase>
	<FormGroup v-if="scopes">
		<template #label>{{ $ts.system }}</template>
		<FormLink v-for="scope in scopes" :to="`/settings/registry/keys/system/${scope.join('/')}`" class="_monospace">{{ scope.join('/') }}</FormLink>
	</FormGroup>
	<FormButton @click="createKey" primary>{{ $ts._registry.createKey }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import * as JSON5 from 'json5';
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
				title: this.$ts.registry,
				icon: 'fas fa-cogs'
			},
			scopes: null,
		}
	},

	created() {
		this.fetch();
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		fetch() {
			os.api('i/registry/scopes').then(scopes => {
				this.scopes = scopes.slice().sort((a, b) => a.join('/').localeCompare(b.join('/')));
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
