<template>
<section class="_card">
	<div class="_title"><Fa :icon="faCloud"/> {{ $t('files') }}</div>
	<div class="_content">
		<MkButton primary @click="clear()"><Fa :icon="faTrashAlt"/> {{ $t('clearCachedFiles') }}</MkButton>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkPagination from '@/components/ui/pagination.vue';
import * as os from '@/os';

export default defineComponent({
	metaInfo() {
		return {
			title: `${this.$t('files')} | ${this.$t('instance')}`
		};
	},

	components: {
		MkButton,
		MkPagination,
	},

	data() {
		return {
			faTrashAlt, faCloud
		}
	},

	methods: {
		clear() {
			os.dialog({
				type: 'warning',
				text: this.$t('clearCachedFilesConfirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				os.api('admin/drive/clean-remote-files', {}).then(() => {
					os.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				});
			});
		}
	}
});
</script>
