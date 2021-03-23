<template>
<XColumn :func="{ handler: setType, title: $ts.timeline }" :column="column" :is-stacked="isStacked" :indicated="indicated" @change-active-state="onChangeActiveState">
	<template #header>
		<Fa v-if="column.tl === 'home'" :icon="faHome"/>
		<Fa v-else-if="column.tl === 'local'" :icon="faComments"/>
		<Fa v-else-if="column.tl === 'social'" :icon="faShareAlt"/>
		<Fa v-else-if="column.tl === 'global'" :icon="faGlobe"/>
		<span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<div class="iwaalbte" v-if="disabled">
		<p>
			<Fa :icon="faMinusCircle"/>
			{{ $t('disabled-timeline.title') }}
		</p>
		<p class="desc">{{ $t('disabled-timeline.description') }}</p>
	</div>
	<XTimeline v-else-if="column.tl" ref="timeline" :src="column.tl" @after="() => $emit('loaded')" @queue="queueUpdated" @note="onNote" :key="column.tl"/>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faMinusCircle, faHome, faComments, faShareAlt, faGlobe, faCog } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XTimeline from '@client/components/timeline.vue';
import * as os from '@client/os';
import { removeColumn, updateColumn } from './deck-store';

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
		if (this.column.tl == null) {
			this.setType();
		} else {
			this.disabled = !this.$i.isModerator && !this.$i.isAdmin && (
				this.$instance.disableLocalTimeline && ['local', 'social'].includes(this.column.tl) ||
				this.$instance.disableGlobalTimeline && ['global'].includes(this.column.tl));
		}
	},

	methods: {
		async setType() {
			const { canceled, result: src } = await os.dialog({
				title: this.$ts.timeline,
				type: null,
				select: {
					items: [{
						value: 'home', text: this.$ts._timelines.home
					}, {
						value: 'local', text: this.$ts._timelines.local
					}, {
						value: 'social', text: this.$ts._timelines.social
					}, {
						value: 'global', text: this.$ts._timelines.global
					}]
				},
			});
			if (canceled) {
				if (this.column.tl == null) {
					removeColumn(this.column.id);
				}
				return;
			}
			updateColumn(this.column.id, {
				tl: src
			});
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
