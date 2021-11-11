<template>
<FormBase>
	<FormInfo warn>{{ $ts.customCssWarn }}</FormInfo>

	<FormTextarea v-model="localCustomCss" manual-save tall class="_monospace" style="tab-size: 2;">
		<span>{{ $ts.local }}</span>
	</FormTextarea>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormInfo from '@/components/debobigego/info.vue';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import * as symbols from '@/symbols';
import { defaultStore } from '@/store';

export default defineComponent({
	components: {
		FormTextarea,
		FormSelect,
		FormRadios,
		FormBase,
		FormGroup,
		FormLink,
		FormButton,
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
		this.$emit('info', this[symbols.PAGE_INFO]);

		this.$watch('localCustomCss', this.apply);
	},

	methods: {
		async apply() {
			localStorage.setItem('customCss', this.localCustomCss);

			const { canceled } = await os.dialog({
				type: 'info',
				text: this.$ts.reloadToApplySetting,
				showCancelButton: true
			});
			if (canceled) return;

			unisonReload();
		}
	}
});
</script>
