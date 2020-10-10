<template>
<section class="_section">
	<div class="_content">
		<MkButton @click="generateToken">{{ $t('generateAccessToken') }}</MkButton>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton, MkInput
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				header: [{
					title: 'API',
					icon: faKey
				}]
			},
		};
	},

	mounted() {
		this.$emit('info', this.INFO);
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
	}
});
</script>
