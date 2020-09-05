<template>
<x-column :menu="menu" :column="column" :is-stacked="isStacked" :indicated="indicated" @change-active-state="onChangeActiveState">
	<template #header>
		<fa v-if="column.tl === 'home'" :icon="faHome"/>
		<fa v-else-if="column.tl === 'local'" :icon="faComments"/>
		<fa v-else-if="column.tl === 'social'" :icon="faShareAlt"/>
		<fa v-else-if="column.tl === 'global'" :icon="faGlobe"/>
		<span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<div class="iwaalbte" v-if="disabled">
		<p>
			<fa :icon="faMinusCircle"/>
			{{ $t('disabled-timeline.title') }}
		</p>
		<p class="desc">{{ $t('disabled-timeline.description') }}</p>
	</div>
	<x-timeline v-else-if="column.tl" ref="timeline" :src="column.tl" @after="() => $emit('loaded')" @queue="queueUpdated" @note="onNote" :key="column.tl"/>
</x-column>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faMinusCircle, faHome, faComments, faShareAlt, faGlobe, faCog } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XTimeline from '../timeline.vue';

export default defineComponent({
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
			menu: null,
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

	created() {
		this.menu = [{
			icon: faCog,
			text: this.$t('timeline'),
			action: this.setType
		}];
	},

	mounted() {
		if (this.column.tl == null) {
			this.setType();
		} else {
			this.disabled = !this.$store.state.i.isModerator && !this.$store.state.i.isAdmin && (
				this.$store.state.instance.meta.disableLocalTimeline && ['local', 'social'].includes(this.column.tl) ||
				this.$store.state.instance.meta.disableGlobalTimeline && ['global'].includes(this.column.tl));
		}
	},

	methods: {
		async setType() {
			const { canceled, result: src } = await this.$root.showDialog({
				title: this.$t('timeline'),
				type: null,
				select: {
					items: [{
						value: 'home', text: this.$t('_timelines.home')
					}, {
						value: 'local', text: this.$t('_timelines.local')
					}, {
						value: 'social', text: this.$t('_timelines.social')
					}, {
						value: 'global', text: this.$t('_timelines.global')
					}]
				},
			});
			if (canceled) {
				if (this.column.tl == null) {
					this.$store.commit('deviceUser/removeDeckColumn', this.column.id);
				}
				return;
			}
			Vue.set(this.column, 'tl', src);
			this.$store.commit('deviceUser/updateDeckColumn', this.column);
		},

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
