<template>
<router-link :to="`/channels/${channel.id}`" class="eftoefju _panel" tabindex="-1">
	<div class="banner" v-if="channel.bannerUrl" :style="`background-image: url('${channel.bannerUrl}')`">
		<div class="fade"></div>
		<div class="name"><fa :icon="faSatelliteDish"/> {{ channel.name }}</div>
		<div class="status">
			<div><fa :icon="faUsers" fixed-width/><i18n path="_channel.usersCount" tag="span" style="margin-left: 4px;"><b place="n">{{ channel.usersCount }}</b></i18n></div>
			<div><fa :icon="faPencilAlt" fixed-width/><i18n path="_channel.notesCount" tag="span" style="margin-left: 4px;"><b place="n">{{ channel.notesCount }}</b></i18n></div>
		</div>
	</div>
	<article>
		<p v-if="channel.description" :title="channel.description">{{ channel.description.length > 85 ? channel.description.slice(0, 85) + '…' : channel.description }}</p>
	</article>
</router-link>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSatelliteDish, faUsers, faPencilAlt } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	props: {
		channel: {
			type: Object,
			required: true
		},
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
	border: 1px solid var(--divider);

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
