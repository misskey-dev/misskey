<template>
<section class="_card">
	<div class="_title"><fa :icon="faCloud"/> {{ $t('files') }}</div>
	<div class="_content">
		<mk-button primary @click="clear()"><fa :icon="faTrashAlt"/> {{ $t('clearCachedFiles') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkPagination from '../../components/ui/pagination.vue';

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
			this.$root.dialog({
				type: 'warning',
				text: this.$t('clearCachedFilesConfirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('admin/drive/clean-remote-files', {}).then(() => {
					this.$root.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				});
			});
		}
	}
});
</script>
