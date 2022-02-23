<template>
<div class="_formRoot">
	<FormSwitch :value="$i.injectFeaturedNote" class="_formBlock" @update:modelValue="onChangeInjectFeaturedNote">
		{{ $ts.showFeaturedNotesInTimeline }}
	</FormSwitch>

	<FormLink to="/settings/account-info" class="_formBlock">{{ $ts.accountInfo }}</FormLink>

	<FormLink to="/settings/delete-account" class="_formBlock"><template #icon><i class="fas fa-exclamation-triangle"></i></template>{{ $ts.closeAccount }}</FormLink>
</div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormLink from '@/components/form/link.vue';
import * as os from '@/os';
import { debug } from '@/config';
import { defaultStore } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormSwitch,
		FormLink,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.other,
				icon: 'fas fa-ellipsis-h',
				bg: 'var(--bg)',
			},
			debug,
		}
	},

	methods: {
		changeDebug(v) {
			console.log(v);
			localStorage.setItem('debug', v.toString());
			unisonReload();
		},

		onChangeInjectFeaturedNote(v) {
			os.api('i/update', {
				injectFeaturedNote: v
			});
		},
	}
});
</script>
