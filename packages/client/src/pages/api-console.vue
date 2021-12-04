<template>
<MkSpacer :content-max="700">
	<div class="_formRoot">
		<div class="_formBlock">
			<MkInput v-model="endpoint" :datalist="endpoints" class="_formBlock" @update:modelValue="onEndpointChange()">
				<template #label>Endpoint</template>
			</MkInput>
			<MkTextarea v-model="body" class="_formBlock" code>
				<template #label>Params (JSON or JSON5)</template>
			</MkTextarea>
			<MkSwitch v-model="withCredential" class="_formBlock">
				With credential
			</MkSwitch>
			<MkButton class="_formBlock" primary :disabled="sending" @click="send">
				<template v-if="sending"><MkEllipsis/></template>
				<template v-else><i class="fas fa-paper-plane"></i> Send</template>
			</MkButton>
		</div>
		<div v-if="res" class="_formBlock">
			<MkTextarea v-model="res" code readonly tall>
				<template #label>Response</template>
			</MkTextarea>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as JSON5 from 'json5';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkSwitch from '@/components/form/switch.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkButton, MkInput, MkTextarea, MkSwitch,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: 'API console',
				icon: 'fas fa-terminal'
			},

			endpoint: '',
			body: '{}',
			res: null,
			sending: false,
			endpoints: [],
			withCredential: true,

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
			const body = JSON5.parse(this.body);
			os.api(this.endpoint, body, body.i || (this.withCredential ? undefined : null)).then(res => {
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
