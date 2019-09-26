<template>
<div>
	<component :is="notesComponent" :pagination="pagination" :extract="items => items.map(item => item.note)"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../../i18n';
//import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n(),

	props: {
		platform: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			pagination: {
				endpoint: 'i/favorites',
				limit: 10,
			},

			notesComponent:
				this.platform === 'desktop' ? () => import('../../../desktop/views/components/detail-notes.vue').then(m => m.default) :
				this.platform === 'mobile' ? () => import('../../../mobile/views/components/detail-notes.vue').then(m => m.default) :
				this.platform === 'deck' ? () => import('../deck/deck.notes.vue').then(m => m.default) : null
		};
	},

	created() {
		this.$emit('init', {
			title: this.$t('@.favorites'),
			icon: faStar
		});
	},

	mounted() {
		document.title = this.$root.instanceName;
	},
});
</script>
