<template>
<FormBase>
	<FormSuspense :p="init">
		<FormGroup>
			<FormInput v-model:value="summalyProxy">
				<template #prefix><i class="fas fa-link"></i></template>
				Summaly Proxy URL
			</FormInput>
		</FormGroup>
		<FormGroup>
			<FormInput v-model:value="deeplAuthKey">
				<template #prefix><i class="fas fa-key"></i></template>
				DeepL Auth Key
			</FormInput>
<<<<<<< HEAD
=======
			<FormSwitch v-model:value="deeplIsPro">
				Pro account
			</FormSwitch>
>>>>>>> f84483896edeb1f8655175b77d35ecd49f6e1985
		</FormGroup>
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
				title: this.$ts.other,
				icon: 'fas fa-cogs'
			},
			summalyProxy: '',
			deeplAuthKey: '',
<<<<<<< HEAD
=======
			deeplIsPro: false,
>>>>>>> f84483896edeb1f8655175b77d35ecd49f6e1985
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
<<<<<<< HEAD
=======
			this.deeplIsPro = meta.deeplIsPro;
>>>>>>> f84483896edeb1f8655175b77d35ecd49f6e1985
		},
		save() {
			os.apiWithDialog('admin/update-meta', {
				summalyProxy: this.summalyProxy,
				deeplAuthKey: this.deeplAuthKey,
<<<<<<< HEAD
=======
				deeplIsPro: this.deeplIsPro,
>>>>>>> f84483896edeb1f8655175b77d35ecd49f6e1985
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
