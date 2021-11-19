<template>
<FormBase>
	<FormGroup>
		<FormInput v-model="emailAddress" type="email">
			{{ $ts.emailAddress }}
			<template v-if="$i.email && !$i.emailVerified" #desc>{{ $ts.verificationEmailSent }}</template>
			<template v-else-if="emailAddress === $i.email && $i.emailVerified" #desc>{{ $ts.emailVerified }}</template>
		</FormInput>
	</FormGroup>
	<FormButton primary @click="save">{{ $ts.save }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormButton from '@/components/debobigego/button.vue';
import FormInput from '@/components/form/input.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormInput,
		FormButton,
		FormGroup,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.emailAddress,
				icon: 'fas fa-envelope',
				bg: 'var(--bg)',
			},
			emailAddress: null,
			code: null,
		}
	},

	created() {
		this.emailAddress = this.$i.email;
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		save() {
			os.inputText({
				title: this.$ts.password,
				type: 'password'
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.apiWithDialog('i/update-email', {
					password: password,
					email: this.emailAddress,
				});
			});
		}
	}
});
</script>
