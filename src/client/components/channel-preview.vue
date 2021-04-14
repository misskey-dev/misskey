<template>
<MkA :to="`/channels/${channel.id}`" class="eftoefju _panel" tabindex="-1">
	<div class="banner" :style="bannerStyle">
		<div class="fade"></div>
		<div class="name"><Fa :icon="faSatelliteDish"/> {{ channel.name }}</div>
		<div class="status">
			<div>
				<Fa :icon="faUsers" fixed-width/>
				<I18n :src="$ts._channel.usersCount" tag="span" style="margin-left: 4px;">
					<template #n>
						<b>{{ channel.usersCount }}</b>
					</template>
				</I18n>
			</div>
			<div>
				<Fa :icon="faPencilAlt" fixed-width/>
				<I18n :src="$ts._channel.notesCount" tag="span" style="margin-left: 4px;">
					<template #n>
						<b>{{ channel.notesCount }}</b>
					</template>
				</I18n>
			</div>
		</div>
	</div>
	<article v-if="channel.description">
		<p :title="channel.description">{{ channel.description.length > 85 ? channel.description.slice(0, 85) + '…' : channel.description }}</p>
	</article>
	<footer>
		<span v-if="channel.lastNotedAt">
			{{ $ts.updatedAt }}: <MkTime :time="channel.lastNotedAt"/>
		</span>
	</footer>
</MkA>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSatelliteDish, faUsers, faPencilAlt } from '@fortawesome/free-solid-svg-icons';

export default defineComponent({
	props: {
		channel: {
			type: Object,
			required: true
		},
	},

	computed: {
		bannerStyle() {
			if (this.channel.bannerUrl) {
				return { backgroundImage: `url(${this.channel.bannerUrl})` };
			} else {
				return { backgroundColor: '#4c5e6d' };
			}
		}
	},

	data() {
		return {
			faSatelliteDish, faUsers, faPencilAlt,
		};
	},
});
</script>

<style lang="scss" scoped>
.eftoefju {
	display: block;
	overflow: hidden;
	width: 100%;

	&:hover {
		text-decoration: none;
	}

	> .banner {
		position: relative;
		width: 100%;
		height: 200px;
		background-position: center;
		background-size: cover;

		> .fade {
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(0deg, var(--panel), var(--X15));
		}

		> .name {
			position: absolute;
			top: 16px;
			left: 16px;
			padding: 12px 16px;
			background: rgba(0, 0, 0, 0.7);
			color: #fff;
			font-size: 1.2em;
		}

		> .status {
			position: absolute;
			z-index: 1;
			bottom: 16px;
			right: 16px;
			padding: 8px 12px;
			font-size: 80%;
			background: rgba(0, 0, 0, 0.7);
			border-radius: 6px;
			color: #fff;
		}
	}

	> article {
		padding: 16px;

		> p {
			margin: 0;
			font-size: 1em;
		}
	}

	> footer {
		padding: 12px 16px;
		border-top: solid 0.5px var(--divider);

		> span {
			opacity: 0.7;
			font-size: 0.9em;
		}
	}

	@media (max-width: 550px) {
		font-size: 0.9em;

		> .banner {
			height: 80px;

			> .status {
				display: none;
			}
		}

		> article {
			padding: 12px;
		}

		> footer {
			display: none;
		}
	}

	@media (max-width: 500px) {
		font-size: 0.8em;

		> .banner {
			height: 70px;
		}

		> article {
			padding: 8px;
		}
	}
}

</style>
