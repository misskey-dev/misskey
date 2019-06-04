<template>
<div class="iwaalbte" v-if="disabled">
	<p>
		<fa :icon="faMinusCircle"/>
		{{ $t('disabled-timeline.title') }}
	</p>
	<p class="desc">{{ $t('disabled-timeline.description') }}</p>
</div>
<x-notes v-else ref="timeline" :pagination="pagination" @inited="() => $emit('loaded')"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XNotes from './deck.notes.vue';
import { faMinusCircle } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('deck'),

	components: {
		XNotes
	},

	props: {
		src: {
			type: String,
			required: false,
			default: 'home'
		},
		mediaOnly: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	data() {
		return {
			connection: null,
			disabled: false,
			faMinusCircle,
			pagination: null
		};
	},

	computed: {
		stream(): unknown {
			switch (this.src) {
				case 'home': return this.$root.stream.useSharedConnection('homeTimeline');
				case 'local': return this.$root.stream.useSharedConnection('localTimeline');
				case 'hybrid': return this.$root.stream.useSharedConnection('hybridTimeline');
				case 'global': return this.$root.stream.useSharedConnection('globalTimeline');
			}
		},

		endpoint(): string {
			switch (this.src) {
				case 'home': return 'notes/timeline';
				case 'local': return 'notes/local-timeline';
				case 'hybrid': return 'notes/hybrid-timeline';
				case 'global': return 'notes/global-timeline';
			}
		},
	},

	watch: {
		mediaOnly() {
			(this.$refs.timeline as unknown).reload();
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
		if (this.src == 'home') {
			this.connection.on('follow', this.onChangeFollowing);
			this.connection.on('unfollow', this.onChangeFollowing);
		}

		this.$root.getMeta().then(meta => {
			this.disabled = !this.$store.state.i.isModerator && !this.$store.state.i.isAdmin && (
				meta.disableLocalTimeline && ['local', 'hybrid'].includes(this.src) ||
				meta.disableGlobalTimeline && ['global'].includes(this.src));
		});
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onNote(note) {
			if (this.mediaOnly && note.files.length == 0) return;
			(this.$refs.timeline as unknown).prepend(note);
		},

		onChangeFollowing() {
			(this.$refs.timeline as unknown).reload();
		},

		focus() {
			(this.$refs.timeline as unknown).focus();
		}
	}
});
</script>

<style lang="stylus" scoped>
.iwaalbte
	color var(--text)
	text-align center

	> p
		margin 16px

		&.desc
			font-size 14px

</style>
