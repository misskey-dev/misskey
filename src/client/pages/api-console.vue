<template>
<div>
<section class="_section">
	<MkInput v-model:value="endpoint" :datalist="endpoints" @update:value="onEndpointChange()">
		<span>Endpoint</span>
	</MkInput>
	<MkTextarea v-model:value="body" code>
		<span>Params (JSON or JSON5)</span>
	</MkTextarea>
	<MkSwitch v-model:value="withCredential">
		With credential
	</MkSwitch>
	<MkButton primary full @click="send" :disabled="sending">
		<template v-if="sending"><MkEllipsis/></template>
		<template v-else><Fa :icon="faPaperPlane"/> Send</template>
	</MkButton>
</section>
<section class="_section" v-if="res">
	<MkTextarea v-model:value="res" code readonly tall>
		<span>Response</span>
	</MkTextarea>
</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTerminal, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import * as JSON5 from 'json5';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkTextarea from '@client/components/ui/textarea.vue';
import MkSwitch from '@client/components/ui/switch.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkButton, MkInput, MkTextarea, MkSwitch,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: 'API console',
				icon: faTerminal
			},

			endpoint: '',
			body: '{}',
			res: null,
			sending: false,
			endpoints: [],
			withCredential: true,

			faPaperPlane
		};
	},

	created() {
		os.api('endpoints').then(endpoints => {
			this.endpoints = endpoints;
		});
	},

	methods: {
		send() {
			this.sending = true;
			os.api(this.endpoint, JSON5.parse(this.body)).then(res => {
				this.sending = false;
				this.res = JSON5.stringify(res, null, 2);
			}, err => {
				this.sending = false;
				this.res = JSON5.stringify(err, null, 2);
			});
		},

		onEndpointChange() {
			os.api('endpoint', { endpoint: this.endpoint }, this.withCredential ? undefined : null).then(endpoint => {
				const body = {};
				for (const p of endpoint.params) {
					body[p.name] =
						p.type === 'String' ? '' :
						p.type === 'Number' ? 0 :
						p.type === 'Boolean' ? false :
						p.type === 'Array' ? [] :
						p.type === 'Object' ? {} :
						null;
				}
				this.body = JSON5.stringify(body, null, 2);
			});
		}
	}
});
</script>
