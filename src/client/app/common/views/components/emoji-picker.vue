<template>
<div class="prlncendiewqqkrevzeruhndoakghvtx">
	<header>
		<button v-for="category in categories"
			:title="category.text"
			@click="go(category)"
			:class="{ active: category.isActive }"
			:key="category.text"
		>
			<fa :icon="category.icon" fixed-width/>
		</button>
	</header>
	<div class="emojis">
		<header><fa :icon="categories.find(x => x.isActive).icon" fixed-width/> {{ categories.find(x => x.isActive).text }}</header>
		<div v-if="categories.find(x => x.isActive).name">
			<button v-for="emoji in emojilist.filter(e => e.category === categories.find(x => x.isActive).name)"
				:title="emoji.name"
				@click="chosen(emoji.char)"
				:key="emoji.name"
			>
				<mk-emoji :emoji="emoji.char"/>
			</button>
		</div>
		<div v-else>
			<button v-for="emoji in customEmojis"
				:title="emoji.name"
				@click="chosen(`:${emoji.name}:`)"
				:key="emoji.name"
			>
				<img :src="emoji.url" :alt="emoji.name"/>
			</button>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { emojilist } from '../../../../../misc/emojilist';
import { faAsterisk, faLeaf, faUtensils, faFutbol, faCity, faDice } from '@fortawesome/free-solid-svg-icons';
import { faHeart, faFlag } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/emoji-picker.vue'),

	data() {
		return {
			emojilist,
			customEmojis: [],
			categories: [{
				text: this.$t('custom-emoji'),
				icon: faAsterisk,
				isActive: true
			}, {
				name: 'people',
				text: this.$t('people'),
				icon: ['far', 'laugh'],
				isActive: false
			}, {
				name: 'animals_and_nature',
				text: this.$t('animals-and-nature'),
				icon: faLeaf,
				isActive: false
			}, {
				name: 'food_and_drink',
				text: this.$t('food-and-drink'),
				icon: faUtensils,
				isActive: false
			}, {
				name: 'activity',
				text: this.$t('activity'),
				icon: faFutbol,
				isActive: false
			}, {
				name: 'travel_and_places',
				text: this.$t('travel-and-places'),
				icon: faCity,
				isActive: false
			}, {
				name: 'objects',
				text: this.$t('objects'),
				icon: faDice,
				isActive: false
			}, {
				name: 'symbols',
				text: this.$t('symbols'),
				icon: faHeart,
				isActive: false
			}, {
				name: 'flags',
				text: this.$t('flags'),
				icon: faFlag,
				isActive: false
			}]
		}
	},

	created() {
		this.customEmojis = (this.$root.getMetaSync() || { emojis: [] }).emojis || [];
	},

	methods: {
		go(category) {
			for (const c of this.categories) {
				c.isActive = c.name === category.name;
			}
		},

		chosen(emoji) {
			this.$emit('chosen', emoji);
		}
	}
});
</script>

<style lang="stylus" scoped>
.prlncendiewqqkrevzeruhndoakghvtx
	width 350px
	background var(--face)

	> header
		display flex

		> button
			flex 1
			padding 10px 0
			font-size 16px
			color var(--text)
			transition color 0.2s ease

			&:hover
				color var(--textHighlighted)
				transition color 0s

			&.active
				color var(--primary)
				transition color 0s

	> .emojis
		height 300px
		overflow-y auto
		overflow-x hidden

		> header
			position sticky
			top 0
			left 0
			z-index 1
			padding 8px
			background var(--faceHeader)
			color var(--text)
			font-size 12px

		> div
			display grid
			grid-template-columns 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr
			gap 4px
			padding 8px

			> button
				padding 0
				width 100%

				&:before
					content ''
					display block
					width 1px
					height 0
					padding-bottom 100%

				&:hover
					> *
						transform scale(1.2)
						transition transform 0s

				> *
					position absolute
					top 0
					left 0
					width 100%
					height 100%
					font-size 28px
					transition transform 0.2s ease
					pointer-events none

</style>
