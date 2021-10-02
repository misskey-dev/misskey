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
import FormTextarea from '@client/components/form/textarea.vue';
import FormSelect from '@client/components/form/select.vue';
import FormRadios from '@client/components/form/radios.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormGroup from '@client/components/debobigego/group.vue';
import FormLink from '@client/components/debobigego/link.vue';
import FormButton from '@client/components/debobigego/button.vue';
import FormInfo from '@client/components/debobigego/info.vue';
import * as os from '@client/os';
import { ColdDeviceStorage } from '@client/store';
import { unisonReload } from '@client/scripts/unison-reload';
import * as symbols from '@client/symbols';
import { defaultStore } from '@client/store';

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
