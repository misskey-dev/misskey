<template>
<section class="_section">
	<div class="_title"><fa :icon="faCloud"/> {{ $t('files') }}</div>
	<div class="_content">
		<x-button primary @click="clear()"><fa :icon="faTrashAlt"/> {{ $t('clearCachedFiles') }}</x-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import XButton from '../../components/ui/button.vue';
import XPagination from '../../components/ui/pagination.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: `${this.$t('files')} | ${this.$t('instance')}`
		};
	},

	components: {
		XButton,
		XPagination,
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

<style lang="scss" scoped>
@import '../../theme';

</style>
