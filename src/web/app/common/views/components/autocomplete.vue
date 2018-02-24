<template>
<div class="mk-autocomplete" @contextmenu.prevent="() => {}">
	<ol class="users" ref="suggests" v-if="users.length > 0">
		<li v-for="user in users" @click="complete(type, user)" @keydown="onKeydown" tabindex="-1">
			<img class="avatar" :src="`${user.avatar_url}?thumbnail&size=32`" alt=""/>
			<span class="name">{{ user.name }}</span>
			<span class="username">@{{ user.username }}</span>
		</li>
	</ol>
	<ol class="emojis" ref="suggests" v-if="emojis.length > 0">
		<li v-for="emoji in emojis" @click="complete(type, pictograph.dic[emoji])" @keydown="onKeydown" tabindex="-1">
			<span class="emoji">{{ pictograph.dic[emoji] }}</span>
			<span class="name" v-html="emoji.replace(q, `<b>${q}</b>`)"></span>
		</li>
	</ol>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as pictograph from 'pictograph';
import contains from '../../../common/scripts/contains';

export default Vue.extend({
	props: ['type', 'q', 'textarea', 'complete', 'close'],
	data() {
		return {
			fetching: true,
			users: [],
			emojis: [],
			select: -1,
			pictograph
		}
	},
	computed: {
		items(): HTMLCollection {
			return (this.$refs.suggests as Element).children;
		}
	},
	mounted() {
		this.textarea.addEventListener('keydown', this.onKeydown);

		Array.from(document.querySelectorAll('body *')).forEach(el => {
			el.addEventListener('mousedown', this.onMousedown);
		});

		if (this.type == 'user') {
			(this as any).api('users/search_by_username', {
				query: this.q,
				limit: 30
			}).then(users => {
				this.users = users;
				this.fetching = false;
			});
		} else if (this.type == 'emoji') {
			const emojis = Object.keys(pictograph.dic).sort((a, b) => a.length - b.length);
			const matched = emojis.filter(e => e.indexOf(this.q) > -1);
			this.emojis = matched.filter((x, i) => i <= 30);
		}
	},
	beforeDestroy() {
		this.textarea.removeEventListener('keydown', this.onKeydown);

		Array.from(document.querySelectorAll('body *')).forEach(el => {
			el.removeEventListener('mousedown', this.onMousedown);
		});
	},
	methods: {
		onMousedown(e) {
			if (!contains(this.$el, e.target) && (this.$el != e.target)) this.close();
		},

		onKeydown(e) {
			const cancel = () => {
				e.preventDefault();
				e.stopPropagation();
			};

			switch (e.which) {
				case 10: // [ENTER]
				case 13: // [ENTER]
					if (this.select !== -1) {
						cancel();
						(this.items[this.select] as any).click();
					} else {
						this.close();
					}
					break;

				case 27: // [ESC]
					cancel();
					this.close();
					break;

				case 38: // [↑]
					if (this.select !== -1) {
						cancel();
						this.selectPrev();
					} else {
						this.close();
					}
					break;

				case 9: // [TAB]
				case 40: // [↓]
					cancel();
					this.selectNext();
					break;

				default:
					this.close();
			}
		},

		selectNext() {
			if (++this.select >= this.items.length) this.select = 0;
			this.applySelect();
		},

		selectPrev() {
			if (--this.select < 0) this.select = this.items.length - 1;
			this.applySelect();
		},

		applySelect() {
			Array.from(this.items).forEach(el => {
				el.removeAttribute('data-selected');
			});

			this.items[this.select].setAttribute('data-selected', 'true');
			(this.items[this.select] as any).focus();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-autocomplete
	position absolute
	z-index 65535
	margin-top calc(1em + 8px)
	overflow hidden
	background #fff
	border solid 1px rgba(0, 0, 0, 0.1)
	border-radius 4px

	> ol
		display block
		margin 0
		padding 4px 0
		max-height 190px
		max-width 500px
		overflow auto
		list-style none

		> li
			display block
			padding 4px 12px
			white-space nowrap
			overflow hidden
			font-size 0.9em
			color rgba(0, 0, 0, 0.8)
			cursor default

			&, *
				user-select none

			&:hover
			&[data-selected='true']
				background $theme-color

				&, *
					color #fff !important

			&:active
				background darken($theme-color, 10%)

				&, *
					color #fff !important

	> .users > li

		.avatar
			vertical-align middle
			min-width 28px
			min-height 28px
			max-width 28px
			max-height 28px
			margin 0 8px 0 0
			border-radius 100%

		.name
			margin 0 8px 0 0
			/*font-weight bold*/
			font-weight normal
			color rgba(0, 0, 0, 0.8)

		.username
			font-weight normal
			color rgba(0, 0, 0, 0.3)

	> .emojis > li

		.emoji
			display inline-block
			margin 0 4px 0 0
			width 24px

		.name
			font-weight normal
			color rgba(0, 0, 0, 0.8)

</style>
