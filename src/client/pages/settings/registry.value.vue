<template>
<FormBase>
	<MkInfo warn>{{ $ts.editTheseSettingsMayBreakAccount }}</MkInfo>

	<template v-if="value">
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.domain }}</template>
				<template #value>{{ $ts.system }}</template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.scope }}</template>
				<template #value>{{ scope.join('/') }}</template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.key }}</template>
				<template #value>{{ xKey }}</template>
			</FormKeyValueView>
		</FormGroup>

		<FormGroup>
			<FormTextarea tall v-model:value="valueForEditor" class="_monospace" style="tab-size: 2;">
				<span>{{ $ts.value }} (JSON)</span>
			</FormTextarea>
			<FormButton @click="save" primary><Fa :icon="faSave"/> {{ $ts.save }}</FormButton>
		</FormGroup>

		<FormKeyValueView>
			<template #key>{{ $ts.updatedAt }}</template>
			<template #value><MkTime :time="value.updatedAt" mode="detail"/></template>
		</FormKeyValueView>

		<FormButton danger @click="del"><Fa :icon="faTrash"/> {{ $ts.delete }}</FormButton>
	</template>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faCogs, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import * as JSON5 from 'json5';
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
			valueForEditor: null,
			faSave, faTrash,
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
				os.dialog({
					type: 'error',
					text: this.$ts.invalidValue
				});
				return;
			}

			os.dialog({
				type: 'warning',
				text: this.$ts.saveConfirm,
				showCancelButton: true
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
			os.dialog({
				type: 'warning',
				text: this.$ts.deleteConfirm,
				showCancelButton: true
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
