<template>
<FormBase>
	<FormSuspense :p="init">
		<FormLink to="/admin/integrations/twitter">
			<i class="fab fa-twitter"></i> Twitter
			<template #suffix>{{ enableTwitterIntegration ? $ts.enabled : $ts.disabled }}</template>
		</FormLink>
		<FormLink to="/admin/integrations/github">
			<i class="fab fa-github"></i> GitHub
			<template #suffix>{{ enableGithubIntegration ? $ts.enabled : $ts.disabled }}</template>
		</FormLink>
		<FormLink to="/admin/integrations/discord">
			<i class="fab fa-discord"></i> Discord
			<template #suffix>{{ enableDiscordIntegration ? $ts.enabled : $ts.disabled }}</template>
		</FormLink>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormLink from '@/components/debobigego/link.vue';
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
		FormLink,
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
				title: this.$ts.integration,
				icon: 'fas fa-share-alt',
				bg: 'var(--bg)',
			},
			enableTwitterIntegration: false,
			enableGithubIntegration: false,
			enableDiscordIntegration: false,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.enableTwitterIntegration = meta.enableTwitterIntegration;
			this.enableGithubIntegration = meta.enableGithubIntegration;
			this.enableDiscordIntegration = meta.enableDiscordIntegration;
		},
	}
});
</script>
