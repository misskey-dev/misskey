<template>
<x-column :menu="menu" :column="column" :is-stacked="isStacked" :indicated="indicated" @change-active-state="onChangeActiveState">
	<template #header>
		<fa v-if="column.type === 'home'" :icon="faHome"/>
		<fa v-if="column.type === 'local'" :icon="faComments"/>
		<fa v-if="column.type === 'social'" :icon="faShareAlt"/>
		<fa v-if="column.type === 'global'" :icon="faGlobe"/>
		<span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<div class="iwaalbte" v-if="disabled">
		<p>
			<fa :icon="faMinusCircle"/>
			{{ $t('disabled-timeline.title') }}
		</p>
		<p class="desc">{{ $t('disabled-timeline.description') }}</p>
	</div>
	<x-timeline v-else ref="timeline" :src="column.type" @after="() => $emit('loaded')" @queue="queueUpdated" @note="onNote"/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import { faMinusCircle, faHome, faComments, faShareAlt, faGlobe } from '@fortawesome/free-solid-svg-icons';
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
			indicated: false,
			columnActive: true,
			faMinusCircle, faHome, faComments, faShareAlt, faGlobe,
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
		queueUpdated(q) {
			if (this.columnActive) {
				this.indicated = q !== 0;
			}
		},

		onNote() {
			if (!this.columnActive) {
				this.indicated = true;
			}
		},

		onChangeActiveState(state) {
			this.columnActive = state;

			if (this.columnActive) {
				this.indicated = false;
			}
		},

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
