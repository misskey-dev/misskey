<template>
<x-window ref="window" :width="400" :height="450" :no-padding="true" @closed="() => { $emit('closed'); destroyDom(); }" :with-ok-button="true" :ok-button-disabled="false" @ok="ok()" :can-close="false">
	<template #header>{{ title || $t('generateAccessToken') }}</template>
	<div class="ugkkpisj">
		<div v-if="information">
			<mk-info warn>{{ information }}</mk-info>
		</div>
		<div>
			<mk-input v-model="name">{{ $t('name') }}</mk-input>
		</div>
		<div>
			<div style="margin-bottom: 16px;"><b>{{ $t('permission') }}</b></div>
			<mk-button inline @click="disableAll">{{ $t('disableAll') }}</mk-button>
			<mk-button inline @click="enableAll">{{ $t('enableAll') }}</mk-button>
			<mk-switch v-for="kind in (initialPermissions || kinds)" :key="kind" v-model="permissions[kind]">{{ $t(`_permissions.${kind}`) }}</mk-switch>
		</div>
	</div>
</x-window>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { kinds } from '../../misc/api-permissions';
import XWindow from './window.vue';
import MkInput from './ui/input.vue';
import MkTextarea from './ui/textarea.vue';
import MkSwitch from './ui/switch.vue';
import MkButton from './ui/button.vue';
import MkInfo from './ui/info.vue';

export default defineComponent({
	components: {
		XWindow,
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
				Vue.set(this.permissions, kind, true);
			}
		} else {
			for (const kind of this.kinds) {
				Vue.set(this.permissions, kind, false);
			}
		}
	},

	methods: {
		ok() {
			this.$emit('ok', {
				name: this.name,
				permissions: Object.keys(this.permissions).filter(p => this.permissions[p])
			});
			this.$refs.window.close();
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

<style lang="scss" scoped>
.ugkkpisj {
	> div {
		padding: 24px;
		border-top: solid 1px var(--divider);
	}
}
</style>
