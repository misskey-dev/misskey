<template>
<FormBase>
	<FormButton primary @click="generateToken">{{ $ts.generateAccessToken }}</FormButton>
	<FormLink to="/settings/apps">{{ $ts.manageAccessTokens }}</FormLink>
	<FormLink to="/api-console" :behavior="isDesktop ? 'window' : null">API console</FormLink>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormButton from '@/components/debobigego/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		FormLink,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: 'API',
				icon: 'fas fa-key',
				bg: 'var(--bg)',
			},
			isDesktop: window.innerWidth >= 1100,
		};
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		generateToken() {
			os.popup(import('@/components/token-generate-window.vue'), {}, {
				done: async result => {
					const { name, permissions } = result;
					const { token } = await os.api('miauth/gen-token', {
						session: null,
						name: name,
						permission: permissions,
					});

					os.alert({
						type: 'success',
						title: this.$ts.token,
						text: token
					});
				},
			}, 'closed');
		},
	}
});
</script>
