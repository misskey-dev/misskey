<template>
<FormBase>
	<FormSuspense :p="init">
		<FormTextarea v-model="blockedHosts">
			<span>{{ $ts.blockedInstances }}</span>
			<template #desc>{{ $ts.blockedInstancesDescription }}</template>
		</FormTextarea>

		<FormButton primary @click="save"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/debobigego/switch.vue';
import FormInput from '@/components/debobigego/input.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormTextarea from '@/components/debobigego/textarea.vue';
import FormInfo from '@/components/debobigego/info.vue';
import FormSuspense from '@/components/debobigego/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormBase,
		FormGroup,
		FormButton,
		FormTextarea,
		FormInfo,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.instanceBlocking,
				icon: 'fas fa-ban',
				bg: 'var(--bg)',
			},
			blockedHosts: '',
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.blockedHosts = meta.blockedHosts.join('\n');
		},

		save() {
			os.apiWithDialog('admin/update-meta', {
				blockedHosts: this.blockedHosts.split('\n') || [],
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
