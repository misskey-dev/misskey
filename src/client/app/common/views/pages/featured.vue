<template>
<div>
	<component :is="notesComponent" :pagination="pagination"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faNewspaper } from '@fortawesome/free-solid-svg-icons';
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
				endpoint: 'notes/featured',
				limit: 29,
			},

			notesComponent:
				this.platform === 'desktop' ? () => import('../../../desktop/views/components/detail-notes.vue').then(m => m.default) :
				this.platform === 'mobile' ? () => import('../../../mobile/views/components/detail-notes.vue').then(m => m.default) :
				this.platform === 'deck' ? () => import('../deck/deck.notes.vue').then(m => m.default) : null
		};
	},

	created() {
		this.$emit('init', {
			title: this.$t('@.featured-notes'),
			icon: faNewspaper
		});
	},

	mounted() {
		document.title = this.$root.instanceName;
	},
});
</script>
