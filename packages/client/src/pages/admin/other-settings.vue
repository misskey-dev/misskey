<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<FormSection>
			<FormInput v-model="summalyProxy" class="_formBlock">
				<template #prefix><i class="fas fa-link"></i></template>
				<template #label>Summaly Proxy URL</template>
			</FormInput>
		</FormSection>
		<FormSection>
			<FormInput v-model="deeplAuthKey" class="_formBlock">
				<template #prefix><i class="fas fa-key"></i></template>
				<template #label>DeepL Auth Key</template>
			</FormInput>
			<FormSwitch v-model="deeplIsPro" class="_formBlock">
				<template #label>Pro account</template>
			</FormSwitch>
		</FormSection>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormSection from '@/components/form/section.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormSection,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.other,
				icon: 'fas fa-cogs',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					icon: 'fas fa-check',
					text: this.$ts.save,
					handler: this.save,
				}],
			},
			summalyProxy: '',
			deeplAuthKey: '',
			deeplIsPro: false,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.summalyProxy = meta.summalyProxy;
			this.deeplAuthKey = meta.deeplAuthKey;
			this.deeplIsPro = meta.deeplIsPro;
		},
		save() {
			os.apiWithDialog('admin/update-meta', {
				summalyProxy: this.summalyProxy,
				deeplAuthKey: this.deeplAuthKey,
				deeplIsPro: this.deeplIsPro,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
