<template>
<XModalWindow ref="dialog"
	:width="400"
	:height="450"
	:with-ok-button="true"
	:ok-button-disabled="false"
	:can-close="false"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
	@ok="ok()"
>
	<template #header>{{ title || $ts.generateAccessToken }}</template>
	<div v-if="information" class="_section">
		<MkInfo warn>{{ information }}</MkInfo>
	</div>
	<div class="_section">
		<MkInput v-model:value="name">{{ $ts.name }}</MkInput>
	</div>
	<div class="_section">
		<div style="margin-bottom: 16px;"><b>{{ $ts.permission }}</b></div>
		<MkButton inline @click="disableAll">{{ $ts.disableAll }}</MkButton>
		<MkButton inline @click="enableAll">{{ $ts.enableAll }}</MkButton>
		<MkSwitch v-for="kind in (initialPermissions || kinds)" :key="kind" v-model:value="permissions[kind]">{{ $t(`_permissions.${kind}`) }}</MkSwitch>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { kinds } from '../../misc/api-permissions';
import XModalWindow from '@/components/ui/modal-window.vue';
import MkInput from './ui/input.vue';
import MkTextarea from './ui/textarea.vue';
import MkSwitch from './ui/switch.vue';
import MkButton from './ui/button.vue';
import MkInfo from './ui/info.vue';

export default defineComponent({
	components: {
		XModalWindow,
		MkInput,
		MkTextarea,
		MkSwitch,
		MkButton,
		MkInfo,
	},

	props: {
		title: {
			type: String,
			required: false,
			default: null
		},
		information: {
			type: String,
			required: false,
			default: null
		},
		initialName: {
			type: String,
			required: false,
			default: null
		},
		initialPermissions: {
			type: Array,
			required: false,
			default: null
		}
	},

	emits: ['done', 'closed'],

	data() {
		return {
			name: this.initialName,
			permissions: {},
			kinds
		};
	},

	created() {
		if (this.initialPermissions) {
			for (const kind of this.initialPermissions) {
				this.permissions[kind] = true;
			}
		} else {
			for (const kind of this.kinds) {
				this.permissions[kind] = false;
			}
		}
	},

	methods: {
		ok() {
			this.$emit('done', {
				name: this.name,
				permissions: Object.keys(this.permissions).filter(p => this.permissions[p])
			});
			this.$refs.dialog.close();
		},

		disableAll() {
			for (const p in this.permissions) {
				this.permissions[p] = false;
			}
		},

		enableAll() {
			for (const p in this.permissions) {
				this.permissions[p] = true;
			}
		}
	}
});
</script>
