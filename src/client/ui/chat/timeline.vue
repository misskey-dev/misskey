<template>
<div class="dbiokgaf top" v-if="['home', 'local', 'social', 'global'].includes(src)">
	<XPostForm/>
</div>
<div class="dbiokgaf tl" ref="body">
	<div class="new" v-if="queue > 0" :style="{ width: width + 'px', [pagination.reversed ? 'bottom' : 'top']: pagination.reversed ? bottom + 'px' : top + 'px' }"><button class="_buttonPrimary" @click="goTop()">{{ $ts.newNoteRecived }}</button></div>
	<XNotes class="tl" ref="tl" :pagination="pagination" @queue="queueUpdated" v-follow="pagination.reversed"/>
</div>
<div class="dbiokgaf bottom" v-if="src === 'channel'">
	<div class="typers" v-if="typers.length > 0">
		<I18n :src="$ts.typingUsers" text-tag="span" class="users">
			<template #users>
				<b v-for="user in typers" :key="user.id" class="user">{{ user.username }}</b>
			</template>
		</I18n>
		<MkEllipsis/>
	</div>
	<XPostForm :channel="channel"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNotes from './notes.vue';
import * as os from '@/os';
import * as sound from '@/scripts/sound';
import { scrollToBottom, getScrollPosition, getScrollContainer } from '@/scripts/scroll';
import follow from '@/directives/follow-append';
import XPostForm from './post-form.vue';

export default defineComponent({
	components: {
		XNotes,
		XPostForm,
	},

	directives: {
		follow
	},
	
	provide() {
		return {
			inChannel: this.src === 'channel'
		};
	},

	props: {
		src: {
			type: String,
			required: true
		},
		list: {
			type: String,
			required: false
		},
		antenna: {
			type: String,
			required: false
		},
		channel: {
			type: String,
			required: false
		},
		sound: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	emits: ['note', 'queue', 'before', 'after'],

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
		};
	},

	created() {
		const prepend = note => {
			(this.$refs.tl as any).prepend(note);

			this.$emit('note');

			if (this.sound) {
				sound.play(note.userId === this.$i.id ? 'noteMy' : 'note');
			}
		};

		const onUserAdded = () => {
			(this.$refs.tl as any).reload();
		};

		const onUserRemoved = () => {
			(this.$refs.tl as any).reload();
		};

		const onChangeFollowing = () => {
			if (!this.$refs.tl.backed) {
				this.$refs.tl.reload();
			}
		};

		let endpoint;
		let reversed = false;

		if (this.src == 'antenna') {
			endpoint = 'antennas/notes';
			this.query = {
				antennaId: this.antenna
			};
			this.connection = os.stream.connectToChannel('antenna', {
				antennaId: this.antenna
			});
			this.connection.on('note', prepend);
		} else if (this.src == 'home') {
			endpoint = 'notes/timeline';
			this.connection = os.stream.useSharedConnection('homeTimeline');
			this.connection.on('note', prepend);

			this.connection2 = os.stream.useSharedConnection('main');
			this.connection2.on('follow', onChangeFollowing);
			this.connection2.on('unfollow', onChangeFollowing);
		} else if (this.src == 'local') {
			endpoint = 'notes/local-timeline';
			this.connection = os.stream.useSharedConnection('localTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'social') {
			endpoint = 'notes/hybrid-timeline';
			this.connection = os.stream.useSharedConnection('hybridTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'global') {
			endpoint = 'notes/global-timeline';
			this.connection = os.stream.useSharedConnection('globalTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'mentions') {
			endpoint = 'notes/mentions';
			this.connection = os.stream.useSharedConnection('main');
			this.connection.on('mention', prepend);
		} else if (this.src == 'directs') {
			endpoint = 'notes/mentions';
			this.query = {
				visibility: 'specified'
			};
			const onNote = note => {
				if (note.visibility == 'specified') {
					prepend(note);
				}
			};
			this.connection = os.stream.useSharedConnection('main');
			this.connection.on('mention', onNote);
		} else if (this.src == 'list') {
			endpoint = 'notes/user-list-timeline';
			this.query = {
				listId: this.list
			};
			this.connection = os.stream.connectToChannel('userList', {
				listId: this.list
			});
			this.connection.on('note', prepend);
			this.connection.on('userAdded', onUserAdded);
			this.connection.on('userRemoved', onUserRemoved);
		} else if (this.src == 'channel') {
			endpoint = 'channels/timeline';
			reversed = true;
			this.query = {
				channelId: this.channel
			};
			this.connection = os.stream.connectToChannel('channel', {
				channelId: this.channel
			});
			this.connection.on('note', prepend);
			this.connection.on('typers', typers => {
				this.typers = this.$i ? typers.filter(u => u.id !== this.$i.id) : typers;
			});
		}

		this.pagination = {
			endpoint: endpoint,
			reversed,
			limit: 10,
			params: init => ({
				untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
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
				const scrollTop = getScrollPosition(this.$refs.body);
				this.width = this.$refs.body.offsetWidth;
				this.top = rect.top + scrollTop;
				this.bottom = this.$refs.body.offsetHeight;
			}
			this.queue = q;
		},
	}
});
</script>

<style lang="scss" scoped>
.dbiokgaf.top {
	padding: 16px 16px 0 16px;
}

.dbiokgaf.bottom {
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

.dbiokgaf.tl {
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
</style>
