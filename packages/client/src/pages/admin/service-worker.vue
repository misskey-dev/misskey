<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<FormSwitch v-model="enableServiceWorker" class="_formBlock">
			<template #label>{{ $ts.enableServiceworker }}</template>
			<template #caption>{{ $ts.serviceworkerInfo }}</template>
		</FormSwitch>

		<template v-if="enableServiceWorker">
			<FormInput v-model="swPublicKey" class="_formBlock">
				<template #prefix><i class="fas fa-key"></i></template>
				<template #label>Public key</template>
			</FormInput>

			<FormInput v-model="swPrivateKey" class="_formBlock">
				<template #prefix><i class="fas fa-key"></i></template>
				<template #label>Private key</template>
			</FormInput>
		</template>

		<FormButton primary class="_formBlock" @click="save"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/ui/button.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
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
