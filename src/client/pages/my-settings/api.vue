<template>
<section class="_card">
	<div class="_title"><fa :icon="faKey"/> API</div>
	<div class="_content">
		<mk-input :value="$store.state.i.token" readonly>
			<span>{{ $t('token') }}</span>
		</mk-input>
		<mk-button @click="regenerateToken"><fa :icon="faSyncAlt"/> {{ $t('regenerate') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faKey, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../i18n';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';

export default Vue.extend({
	i18n,
	components: {
		MkButton, MkInput
	},
	data() {
		return {
			faKey, faSyncAlt
		};
	},
	methods: {
		regenerateToken() {
			this.$root.dialog({
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
