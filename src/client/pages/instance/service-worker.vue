<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model="enableServiceWorker">
			{{ $ts.enableServiceworker }}
			<template #desc>{{ $ts.serviceworkerInfo }}</template>
		</FormSwitch>

		<template v-if="enableServiceWorker">
			<FormInput v-model="swPublicKey">
				<template #prefix><i class="fas fa-key"></i></template>
				Public key
			</FormInput>

			<FormInput v-model="swPrivateKey">
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
import FormSwitch from '@client/components/debobigego/switch.vue';
import FormInput from '@client/components/debobigego/input.vue';
import FormButton from '@client/components/debobigego/button.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormGroup from '@client/components/debobigego/group.vue';
import FormSuspense from '@client/components/debobigego/suspense.vue';
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
				icon: 'fas fa-bolt',
				bg: 'var(--bg)',
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
