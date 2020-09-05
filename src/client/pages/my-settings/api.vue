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
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';

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
			this.$root.new(await import('../../components/token-generate-window.vue'), {
			}).$on('ok', async ({ name, permissions }) => {
				const { token } = await this.$root.api('miauth/gen-token', {
					session: null,
					name: name,
					permission: permissions,
				});

				this.$root.showDialog({
					type: 'success',
					title: this.$t('token'),
					text: token
				});
			});
		},
		regenerateToken() {
			this.$root.showDialog({
				title: this.$t('password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				this.$root.api('i/regenerate_token', {
					password: password
				});
			});
		},
	}
});
</script>
