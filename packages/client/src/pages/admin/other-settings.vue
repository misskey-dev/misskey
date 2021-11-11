<template>
<FormBase>
	<FormSuspense :p="init">
		<FormGroup>
			<FormInput v-model="summalyProxy">
				<template #prefix><i class="fas fa-link"></i></template>
				Summaly Proxy URL
			</FormInput>
		</FormGroup>
		<FormGroup>
			<FormInput v-model="deeplAuthKey">
				<template #prefix><i class="fas fa-key"></i></template>
				DeepL Auth Key
			</FormInput>
			<FormSwitch v-model="deeplIsPro">
				Pro account
			</FormSwitch>
		</FormGroup>
		<FormButton @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/debobigego/switch.vue';
import FormInput from '@/components/debobigego/input.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormSuspense from '@/components/debobigego/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

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
				title: this.$ts.other,
				icon: 'fas fa-cogs',
				bg: 'var(--bg)',
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
