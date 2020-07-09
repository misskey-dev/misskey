<template>
<x-column :menu="menu" :column="column" :is-stacked="isStacked">
	<template #header>
		<fa v-if="column.type === 'home'" :icon="faHome"/>
		<fa v-if="column.type === 'local'" :icon="faComments"/>
		<fa v-if="column.type === 'social'" :icon="faShareAlt"/>
		<fa v-if="column.type === 'global'" :icon="faGlobe"/>
		<fa v-if="column.type === 'list'" :icon="faListUl"/>
		<fa v-if="column.type === 'antenna'" :icon="faSatellite"/>
		<span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<div class="iwaalbte" v-if="disabled">
		<p>
			<fa :icon="faMinusCircle"/>
			{{ $t('disabled-timeline.title') }}
		</p>
		<p class="desc">{{ $t('disabled-timeline.description') }}</p>
	</div>
	<x-timeline v-else ref="timeline" :src="column.type" @after="() => $emit('loaded')"/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import { faMinusCircle, faHome, faComments, faShareAlt, faGlobe, faListUl, faSatellite } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XTimeline from '../timeline.vue';

export default Vue.extend({
	components: {
		XColumn,
		XTimeline,
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: true
		}
	},

	data() {
		return {
			disabled: false,
			faMinusCircle, faHome, faComments, faShareAlt, faGlobe, faListUl, faSatellite
		};
	},

	watch: {
		mediaOnly() {
			(this.$refs.timeline as any).reload();
		}
	},

	mounted() {
		this.disabled = !this.$store.state.i.isModerator && !this.$store.state.i.isAdmin && (
			this.$store.state.instance.meta.disableLocalTimeline && ['local', 'social'].includes(this.column.type) ||
			this.$store.state.instance.meta.disableGlobalTimeline && ['global'].includes(this.column.type));
	},

	methods: {
		focus() {
			(this.$refs.timeline as any).focus();
		}
	}
});
</script>

<style lang="scss" scoped>
.iwaalbte {
	text-align: center;

	> p {
		margin: 16px;

		&.desc {
			font-size: 14px;
		}
	}
}
</style>
