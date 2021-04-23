<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model:value="enableServiceWorker">
			{{ $ts.enableServiceworker }}
			<template #desc>{{ $ts.serviceworkerInfo }}</template>
		</FormSwitch>

		<template v-if="enableServiceWorker">
			<FormInput v-model:value="swPublicKey">
				<template #prefix><i class="fas fa-key"></i></template>
				Public key
			</FormInput>

			<FormInput v-model:value="swPrivateKey">
				<template #prefix><i class="fas fa-key"></i></template>
				Private key
			</FormInput>
		</template>

		<FormButton @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormInput from '@client/components/form/input.vue';
import FormButton from '@client/components/form/button.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormSuspense from '@client/components/form/suspense.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import { fetchInstance } from '@client/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormBase,
		FormGroup,
		FormButton,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: 'ServiceWorker',
				icon: 'fas fa-bolt'
			},
			enableServiceWorker: false,
			swPublicKey: null,
			swPrivateKey: null,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.enableServiceWorker = meta.enableServiceWorker;
			this.swPublicKey = meta.swPublickey;
			this.swPrivateKey = meta.swPrivateKey;
		},
		save() {
			os.apiWithDialog('admin/update-meta', {
				enableServiceWorker: this.enableServiceWorker,
				swPublicKey: this.swPublicKey,
				swPrivateKey: this.swPrivateKey,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
