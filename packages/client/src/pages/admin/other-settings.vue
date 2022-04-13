<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		none
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormSection from '@/components/form/section.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormSection,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.other,
				icon: 'fas fa-cogs',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					icon: 'fas fa-check',
					text: this.$ts.save,
					handler: this.save,
				}],
			},
		}
	},

	methods: {
		async init() {
			const meta = await os.api('admin/meta');
		},
		save() {
			os.apiWithDialog('admin/update-meta', {
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
