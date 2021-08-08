<template>
<div v-if="channel" class="hhizbblb">
	<div class="info" v-if="date">
		<MkInfo>{{ $ts.showingPastTimeline }} <button class="_textButton clear" @click="timetravel()">{{ $ts.clear }}</button></MkInfo>
	</div>
	<div class="tl" ref="body">
		<div class="new" v-if="queue > 0" :style="{ width: width + 'px', bottom: bottom + 'px' }"><button class="_buttonPrimary" @click="goTop()">{{ $ts.newNoteRecived }}</button></div>
		<XNotes class="tl" ref="tl" :pagination="pagination" @queue="queueUpdated" v-follow="true"/>
	</div>
	<div class="bottom">
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
</div>
</template>

<script lang="ts">
import { computed, defineComponent, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
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
	
	provide() {
		return {
			inChannel: true
		};
	},

	props: {
		channelId: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			channel: null as Misskey.entities.Channel | null,
			connection: null,
			pagination: null,
			baseQuery: {
				includeMyRenotes: this.$store.state.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.showLocalRenotes
			},
			queue: 0,
			width: 0,
			top: 0,
			bottom: 0,
			typers: [],
			date: null,
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.channel ? this.channel.name : '-',
				subtitle: this.channel ? this.channel.description : '-',
				icon: 'fas fa-satellite-dish',
				actions: [{
					icon: this.channel?.isFollowing ? 'fas fa-star' : 'far fa-star',
					text: this.channel?.isFollowing ? this.$ts.unfollow : this.$ts.follow,
					highlighted: this.channel?.isFollowing,
					handler: this.toggleChannelFollow
				}, {
					icon: 'fas fa-search',
					text: this.$ts.inChannelSearch,
					handler: this.inChannelSearch
				}, {
					icon: 'fas fa-calendar-alt',
					text: this.$ts.jumpToSpecifiedDate,
					handler: this.timetravel
				}]
			})),
		};
	},

	async created() {
		this.channel = await os.api('channels/show', { channelId: this.channelId });

		const prepend = note => {
			(this.$refs.tl as any).prepend(note);

			this.$emit('note');

			sound.play(note.userId === this.$i.id ? 'noteMy' : 'note');
		};

		this.connection = markRaw(os.stream.useChannel('channel', {
			channelId: this.channelId
		}));
		this.connection.on('note', prepend);
		this.connection.on('typers', typers => {
			this.typers = this.$i ? typers.filter(u => u.id !== this.$i.id) : typers;
		});

		this.pagination = {
			endpoint: 'channels/timeline',
			reversed: true,
			limit: 10,
			params: init => ({
				channelId: this.channelId,
				untilDate: this.date?.getTime(),
				...this.baseQuery
			})
		};
	},

	mounted() {

	},

	beforeUnmount() {
		this.connection.dispose();
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

		async inChannelSearch() {
			const { canceled, result: query } = await os.dialog({
				title: this.$ts.inChannelSearch,
				input: true
			});
			if (canceled || query == null || query === '') return;
			router.push(`/search?q=${encodeURIComponent(query)}&channel=${this.channelId}`);
		},

		async toggleChannelFollow() {
			if (this.channel.isFollowing) {
				await os.apiWithDialog('channels/unfollow', {
					channelId: this.channel.id
				});
				this.channel.isFollowing = false;
			} else {
				await os.apiWithDialog('channels/follow', {
					channelId: this.channel.id
				});
				this.channel.isFollowing = true;
			}
		},

		openChannelMenu(ev) {
			os.popupMenu([{
				text: this.$ts.copyUrl,
				icon: 'fas fa-link',
				action: () => {
					copyToClipboard(`${url}/channels/${this.currentChannel.id}`);
				}
			}], ev.currentTarget || ev.target);
		},

		timetravel(date?: Date) {
			this.date = date;
			this.$refs.tl.reload();
		}
	}
});
</script>

<style lang="scss" scoped>
.hhizbblb {
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
