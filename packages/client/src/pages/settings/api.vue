<template>
<div class="_formRoot">
	<FormButton primary class="_formBlock" @click="generateToken">{{ $ts.generateAccessToken }}</FormButton>
	<FormLink to="/settings/apps" class="_formBlock">{{ $ts.manageAccessTokens }}</FormLink>
	<FormLink to="/api-console" :behavior="isDesktop ? 'window' : null" class="_formBlock">API console</FormLink>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormLink from '@/components/form/link.vue';
import FormButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
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
