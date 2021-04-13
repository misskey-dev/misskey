<template>
<FormBase>
	<FormButton @click="generateToken" primary>{{ $ts.generateAccessToken }}</FormButton>
	<FormLink to="/settings/apps">{{ $ts.manageAccessTokens }}</FormLink>
	<FormLink to="/api-console" :behavior="isDesktop ? 'window' : null">API console</FormLink>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@client/components/form/switch.vue';
import FormSelect from '@client/components/form/select.vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

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
				icon: faKey
			},
			isDesktop: window.innerWidth >= 1100,
		};
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		generateToken() {
			os.popup(import('@client/components/token-generate-window.vue'), {}, {
				done: async result => {
					const { name, permissions } = result;
					const { token } = await os.api('miauth/gen-token', {
						session: null,
						name: name,
						permission: permissions,
					});

					os.dialog({
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
