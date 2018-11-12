<template>
<div class="prlncendiewqqkrevzeruhndoakghvtx">
	<header>
		<button v-for="category in categories"
			:title="category.text"
			@click="go(category.ref)"
			:class="{ active: category.isActive }"
		>
			<fa :icon="category.icon" fixed-width/>
		</button>
	</header>
	<div class="emojis" ref="emojis" @scroll.passive="onScroll">
		<section v-for="category in categories" :ref="category.ref">
			<header><fa :icon="category.icon" fixed-width/> {{ category.text }}</header>
			<div v-if="category.name">
				<button v-for="emoji in Object.entries(lib).filter(([k, v]) => v.category === category.name)"
					:title="emoji[0]"
					@click="chosen(emoji[1].char)"
				>
					<mk-emoji :emoji="emoji[1].char"/>
				</button>
			</div>
			<div v-else>
				<button v-for="emoji in customEmojis"
					:title="emoji.name"
					@click="chosen(`:${emoji.name}:`)"
				>
					<img :src="emoji.url" :alt="emoji.name"/>
				</button>
			</div>
		</section>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { lib } from 'emojilib';

export default Vue.extend({
	i18n: i18n('common/views/components/emoji-picker.vue'),

	data() {
		return {
			lib,
			customEmojis: [],
			categories: [{
				ref: 'customEmojiSection',
				text: this.$t('custom-emoji'),
				icon: ['fas', 'asterisk'],
				isActive: true
			}, {
				name: 'people',
				ref: 'peopleSection',
				text: this.$t('people'),
				icon: ['far', 'laugh'],
				isActive: false
			}, {
				name: 'animals_and_nature',
				ref: 'animalsAndNatureSection',
				text: this.$t('animals-and-nature'),
				icon: ['fas', 'leaf'],
				isActive: false
			}, {
				name: 'food_and_drink',
				ref: 'foodAndDrinkSection',
				text: this.$t('food-and-drink'),
				icon: ['fas', 'utensils'],
				isActive: false
			}, {
				name: 'activity',
				ref: 'activitySection',
				text: this.$t('activity'),
				icon: ['fas', 'futbol'],
				isActive: false
			}, {
				name: 'travel_and_places',
				ref: 'travelAndPlacesSection',
				text: this.$t('travel-and-places'),
				icon: ['fas', 'city'],
				isActive: false
			}, {
				name: 'objects',
				ref: 'objectsSection',
				text: this.$t('objects'),
				icon: ['fas', 'poo-storm'],
				isActive: false
			}, {
				name: 'symbols',
				ref: 'symbolsSection',
				text: this.$t('symbols'),
				icon: ['far', 'heart'],
				isActive: false
			}, {
				name: 'flags',
				ref: 'flagsSection',
				text: this.$t('flags'),
				icon: ['far', 'flag'],
				isActive: false
			}]
		}
	},

	created() {
		this.customEmojis = (this.$root.getMetaSync() || { emojis: [] }).emojis || [];
	},

	methods: {
		go(ref) {
			this.$refs.emojis.scrollTop = this.$refs[ref][0].offsetTop;
		},

		onScroll(e) {
			const section = this.categories.forEach(x => {
				const top = e.target.scrollTop;
				const el = this.$refs[x.ref][0];
				x.isActive = el.offsetTop <= top && el.offsetTop + el.offsetHeight > top;
			});
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

		> section
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
