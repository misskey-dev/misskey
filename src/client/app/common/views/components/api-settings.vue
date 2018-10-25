<template>
<ui-card>
	<div slot="title">%fa:key% API</div>

	<section class="fit-top">
		<ui-input :value="$store.state.i.token" readonly>
			<span>%i18n:@token%</span>
		</ui-input>
		<p>%i18n:@intro%</p>
		<ui-info warn>%i18n:@caution%</ui-info>
		<p>%i18n:@regeneration-of-token%</p>
		<ui-button @click="regenerateToken">%fa:sync-alt% %i18n:@regenerate-token%</ui-button>
	</section>

	<section>
		<header>%fa:terminal% %i18n:@console.title%</header>
		<ui-input v-model="endpoint">
			<span>%i18n:@console.endpoint%</span>
		</ui-input>
		<ui-textarea v-model="body">
			<span>%i18n:@console.parameter% (JSON or JSON5)</span>
		</ui-textarea>
		<ui-button @click="send" :disabled="sending">
			<template v-if="sending">%i18n:@console.sending%</template>
			<template v-else>%fa:paper-plane% %i18n:@console.send%</template>
		</ui-button>
		<ui-textarea v-if="res" v-model="res">
			<span>%i18n:@console.response%</span>
		</ui-textarea>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import * as JSON5 from 'json5';

export default Vue.extend({
	data() {
		return {
			endpoint: '',
			body: '{}',
			res: null,
			sending: false
		};
	},

	methods: {
		regenerateToken() {
			(this as any).apis.input({
				title: '%i18n:@enter-password%',
				type: 'password'
			}).then(password => {
				(this as any).api('i/regenerate_token', {
					password: password
				});
			});
		},

		send() {
			this.sending = true;
			(this as any).api(this.endpoint, JSON5.parse(this.body)).then(res => {
				this.sending = false;
				this.res = JSON5.stringify(res, null, 2);
			}, err => {
				this.sending = false;
				this.res = JSON5.stringify(err, null, 2);
			});
		}
	}
});
</script>
