<template>
<div class="_formRoot">
	<FormInfo warn class="_formBlock">{{ $ts.customCssWarn }}</FormInfo>

	<FormTextarea v-model="localCustomCss" manual-save tall class="_monospace _formBlock" style="tab-size: 2;">
		<template #label>CSS</template>
	</FormTextarea>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormInfo from '@/components/ui/info.vue';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import * as symbols from '@/symbols';
import { defaultStore } from '@/store';

export default defineComponent({
	components: {
		FormTextarea,
		FormInfo,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.customCss,
				icon: 'fas fa-code',
				bg: 'var(--bg)',
			},
			localCustomCss: localStorage.getItem('customCss')
		}
	},

	mounted() {
		this.$watch('localCustomCss', this.apply);
	},

	methods: {
		async apply() {
			localStorage.setItem('customCss', this.localCustomCss);

			const { canceled } = await os.confirm({
				type: 'info',
				text: this.$ts.reloadToApplySetting,
			});
			if (canceled) return;

			unisonReload();
		}
	}
});
</script>
