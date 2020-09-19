<template>
<section class="_card">
	<div class="_title"><fa :icon="faKey"/> API</div>
	<div class="_content">
		<mk-button @click="generateToken">{{ $t('generateAccessToken') }}</mk-button>
		<mk-button @click="regenerateToken"><fa :icon="faSyncAlt"/> {{ $t('regenerate') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faKey, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton, MkInput
	},
	data() {
		return {
			faKey, faSyncAlt
		};
	},
	methods: {
		async generateToken() {
			os.modal(await import('@/components/token-generate-window.vue'), {}).then(async result => {
				if (result == null) return;
				const { name, permissions } = result;
				const { token } = await os.api('miauth/gen-token', {
					session: null,
					name: name,
					permission: permissions,
				});

				os.dialog({
					type: 'success',
					title: this.$t('token'),
					text: token
				});
			});
		},
		regenerateToken() {
			os.dialog({
				title: this.$t('password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.api('i/regenerate_token', {
					password: password
				});
			});
		},
	}
});
</script>
