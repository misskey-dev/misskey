<template>
<mk-ui>
	<mk-home :mode="mode" @loaded="loaded"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';
import getNoteSummary from '../../../../../renderers/get-note-summary';

export default Vue.extend({
	props: {
		mode: {
			type: String,
			default: 'timeline'
		}
	},
	data() {
		return {
			connection: null,
			connectionId: null,
			unreadCount: 0
		};
	},
	mounted() {
		document.title = 'Misskey';

		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

		this.connection.on('note', this.onStreamNote);
		document.addEventListener('visibilitychange', this.onVisibilitychange, false);

		Progress.start();
	},
	beforeDestroy() {
		this.connection.off('note', this.onStreamNote);
		(this as any).os.stream.dispose(this.connectionId);
		document.removeEventListener('visibilitychange', this.onVisibilitychange);
	},
	methods: {
		loaded() {
			Progress.done();
		},

		onStreamNote(note) {
			if (document.hidden && note.userId != (this as any).os.i.id) {
				this.unreadCount++;
				document.title = `(${this.unreadCount}) ${getNoteSummary(note)}`;
			}
		},

		onVisibilitychange() {
			if (!document.hidden) {
				this.unreadCount = 0;
				document.title = 'Misskey';
			}
		}
	}
});
</script>
