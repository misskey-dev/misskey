<template>
<x-column :menu="menu" :column="column" :is-stacked="isStacked">
	<template #header>
		<fa v-if="column.type == 'home'" :icon="faHome"/>
		<fa v-if="column.type == 'local'" :icon="faComments"/>
		<fa v-if="column.type == 'hybrid'" :icon="faShareAlt"/>
		<fa v-if="column.type == 'global'" :icon="faGlobe"/>
		<span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<div class="iwaalbte" v-if="disabled">
		<p>
			<fa :icon="faMinusCircle"/>
			{{ $t('disabled-timeline.title') }}
		</p>
		<p class="desc">{{ $t('disabled-timeline.description') }}</p>
	</div>
	<x-notes v-else ref="timeline" :pagination="pagination" @after="() => $emit('loaded')"/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import { faMinusCircle, faHome, faComments, faShareAlt, faGlobe } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XNotes from '../notes.vue';

export default Vue.extend({
	components: {
		XColumn,
		XNotes,
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
			connection: null,
			disabled: false,
			pagination: null,
			faMinusCircle, faHome, faComments, faShareAlt, faGlobe
		};
	},

	computed: {
		stream(): any {
			switch (this.column.type) {
				case 'home': return this.$root.stream.useSharedConnection('homeTimeline');
				case 'local': return this.$root.stream.useSharedConnection('localTimeline');
				case 'hybrid': return this.$root.stream.useSharedConnection('hybridTimeline');
				case 'global': return this.$root.stream.useSharedConnection('globalTimeline');
			}
		},

		endpoint(): string {
			switch (this.column.type) {
				case 'home': return 'notes/timeline';
				case 'local': return 'notes/local-timeline';
				case 'hybrid': return 'notes/hybrid-timeline';
				case 'global': return 'notes/global-timeline';
			}
		},
	},

	watch: {
		mediaOnly() {
			(this.$refs.timeline as any).reload();
		}
	},

	created() {
		this.pagination = {
			endpoint: this.endpoint,
			limit: 10,
			params: init => ({
				untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
				withFiles: this.mediaOnly,
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes
			})
		};
	},

	mounted() {
		this.connection = this.stream;

		this.connection.on('note', this.onNote);
		if (this.column.type === 'home') {
			this.connection.on('follow', this.onChangeFollowing);
			this.connection.on('unfollow', this.onChangeFollowing);
		}

		this.disabled = !this.$store.state.i.isModerator && !this.$store.state.i.isAdmin && (
			this.$store.state.instance.meta.disableLocalTimeline && ['local', 'hybrid'].includes(this.column.type) ||
			this.$store.state.instance.meta.disableGlobalTimeline && ['global'].includes(this.column.type));
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onNote(note) {
			if (this.mediaOnly && note.files.length == 0) return;
			(this.$refs.timeline as any).prepend(note);
		},

		onChangeFollowing() {
			(this.$refs.timeline as any).reload();
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
