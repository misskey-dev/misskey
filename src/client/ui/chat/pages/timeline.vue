<template>
<div class="dbiokgaf">
	<div class="info" v-if="date">
		<MkInfo>{{ $ts.showingPastTimeline }} <button class="_textButton clear" @click="timetravel()">{{ $ts.clear }}</button></MkInfo>
	</div>
	<div class="top">
		<XPostForm/>
	</div>
	<div class="tl" ref="body">
		<div class="new" v-if="queue > 0" :style="{ width: width + 'px', top: top + 'px' }"><button class="_buttonPrimary" @click="goTop()">{{ $ts.newNoteRecived }}</button></div>
		<XNotes class="tl" ref="tl" :pagination="pagination" @queue="queueUpdated"/>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, markRaw } from 'vue';
import XNotes from '../notes.vue';
import * as os from '@client/os';
import * as sound from '@client/scripts/sound';
import { scrollToBottom, getScrollPosition, getScrollContainer } from '@client/scripts/scroll';
import follow from '@client/directives/follow-append';
import XPostForm from '../post-form.vue';
import MkInfo from '@client/components/ui/info.vue';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XNotes,
		XPostForm,
		MkInfo,
	},

	directives: {
		follow
	},

	props: {
		src: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			connection: null,
			connection2: null,
			pagination: null,
			baseQuery: {
				includeMyRenotes: this.$store.state.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.showLocalRenotes
			},
			query: {},
			queue: 0,
			width: 0,
			top: 0,
			bottom: 0,
			typers: [],
			date: null,
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.$ts.timeline,
				icon: 'fas fa-home',
				actions: [{
					icon: 'fas fa-calendar-alt',
					text: this.$ts.jumpToSpecifiedDate,
					handler: this.timetravel
				}]
			})),
		};
	},

	created() {
		const prepend = note => {
			(this.$refs.tl as any).prepend(note);

			this.$emit('note');

			sound.play(note.userId === this.$i.id ? 'noteMy' : 'note');
		};

		const onChangeFollowing = () => {
			if (!this.$refs.tl.backed) {
				this.$refs.tl.reload();
			}
		};

		let endpoint;

		if (this.src == 'home') {
			endpoint = 'notes/timeline';
			this.connection = markRaw(os.stream.useChannel('homeTimeline'));
			this.connection.on('note', prepend);

			this.connection2 = markRaw(os.stream.useChannel('main'));
			this.connection2.on('follow', onChangeFollowing);
			this.connection2.on('unfollow', onChangeFollowing);
		} else if (this.src == 'local') {
			endpoint = 'notes/local-timeline';
			this.connection = markRaw(os.stream.useChannel('localTimeline'));
			this.connection.on('note', prepend);
		} else if (this.src == 'social') {
			endpoint = 'notes/hybrid-timeline';
			this.connection = markRaw(os.stream.useChannel('hybridTimeline'));
			this.connection.on('note', prepend);
		} else if (this.src == 'global') {
			endpoint = 'notes/global-timeline';
			this.connection = markRaw(os.stream.useChannel('globalTimeline'));
			this.connection.on('note', prepend);
		}

		this.pagination = {
			endpoint: endpoint,
			limit: 10,
			params: init => ({
				untilDate: this.date?.getTime(),
				...this.baseQuery, ...this.query
			})
		};
	},

	mounted() {

	},

	beforeUnmount() {
		this.connection.dispose();
		if (this.connection2) this.connection2.dispose();
	},

	methods: {
		focus() {
			this.$refs.body.focus();
		},

		goTop() {
			const container = getScrollContainer(this.$refs.body);
			container.scrollTop = 0;
		},

		queueUpdated(q) {
			if (this.$refs.body.offsetWidth !== 0) {
				const rect = this.$refs.body.getBoundingClientRect();
				this.width = this.$refs.body.offsetWidth;
				this.top = rect.top;
				this.bottom = this.$refs.body.offsetHeight;
			}
			this.queue = q;
		},

		timetravel(date?: Date) {
			this.date = date;
			this.$refs.tl.reload();
		}
	}
});
</script>

<style lang="scss" scoped>
.dbiokgaf {
	display: flex;
	flex-direction: column;
	flex: 1;
	overflow: auto;

	> .info {
		padding: 16px 16px 0 16px;
	}

	> .top {
		padding: 16px 16px 0 16px;
	}

	> .bottom {
		padding: 0 16px 16px 16px;
		position: relative;

		> .typers {
			position: absolute;
			bottom: 100%;
			padding: 0 8px 0 8px;
			font-size: 0.9em;
			background: var(--panel);
			border-radius: 0 8px 0 0;
			color: var(--fgTransparentWeak);

			> .users {
				> .user + .user:before {
					content: ", ";
					font-weight: normal;
				}

				> .user:last-of-type:after {
					content: " ";
				}
			}
		}
	}

	> .tl {
		position: relative;
		padding: 16px 0;
		flex: 1;
		min-width: 0;
		overflow: auto;

		> .new {
			position: fixed;
			z-index: 1000;

			> button {
				display: block;
				margin: 16px auto;
				padding: 8px 16px;
				border-radius: 32px;
			}
		}
	}
}
</style>
