<template>
<FormBase>
	<FormInfo warn>{{ $ts.editTheseSettingsMayBreakAccount }}</FormInfo>

	<template v-if="value">
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts._registry.domain }}</template>
				<template #value>{{ $ts.system }}</template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts._registry.scope }}</template>
				<template #value>{{ scope.join('/') }}</template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts._registry.key }}</template>
				<template #value>{{ xKey }}</template>
			</FormKeyValueView>
		</FormGroup>

		<FormGroup>
			<FormTextarea v-model="valueForEditor" tall class="_monospace" style="tab-size: 2;">
				<span>{{ $ts.value }} (JSON)</span>
			</FormTextarea>
			<FormButton primary @click="save"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
		</FormGroup>

		<FormKeyValueView>
			<template #key>{{ $ts.updatedAt }}</template>
			<template #value><MkTime :time="value.updatedAt" mode="detail"/></template>
		</FormKeyValueView>

		<FormButton danger @click="del"><i class="fas fa-trash"></i> {{ $ts.delete }}</FormButton>
	</template>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import * as JSON5 from 'json5';
import FormInfo from '@/components/debobigego/info.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormKeyValueView from '@/components/debobigego/key-value-view.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormInfo,
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
			[symbols.PAGE_INFO]: {
				title: this.$ts.registry,
				icon: 'fas fa-cogs',
				bg: 'var(--bg)',
			},
			value: null,
			valueForEditor: null,
		}
	},

	watch: {
		key() {
			this.fetch();
		},
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
		this.fetch();
	},

	methods: {
		fetch() {
			os.api('i/registry/get-detail', {
				scope: this.scope,
				key: this.xKey
			}).then(value => {
				this.value = value;
				this.valueForEditor = JSON5.stringify(this.value.value, null, '\t');
			});
		},

		save() {
			try {
				JSON5.parse(this.valueForEditor);
			} catch (e) {
				os.alert({
					type: 'error',
					text: this.$ts.invalidValue
				});
				return;
			}

			os.confirm({
				type: 'warning',
				text: this.$ts.saveConfirm,
			}).then(({ canceled }) => {
				if (canceled) return;
				os.apiWithDialog('i/registry/set', {
					scope: this.scope,
					key: this.xKey,
					value: JSON5.parse(this.valueForEditor)
				});
			});
		},

		del() {
			os.confirm({
				type: 'warning',
				text: this.$ts.deleteConfirm,
			}).then(({ canceled }) => {
				if (canceled) return;
				os.apiWithDialog('i/registry/remove', {
					scope: this.scope,
					key: this.xKey
				});
			});
		}
	}
});
</script>
