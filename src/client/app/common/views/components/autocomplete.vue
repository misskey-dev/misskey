<template>
<div class="mk-autocomplete" @contextmenu.prevent="() => {}">
	<ol class="users" ref="suggests" v-if="users.length > 0">
		<li v-for="user in users" @click="complete(type, user)" @keydown="onKeydown" tabindex="-1">
			<img class="avatar" :src="`${user.avatarUrl}?thumbnail&size=32`" alt=""/>
			<span class="name">{{ user | userName }}</span>
			<span class="username">@{{ user | acct }}</span>
		</li>
	</ol>
	<ol class="emojis" ref="suggests" v-if="emojis.length > 0">
		<li v-for="emoji in emojis" @click="complete(type, emoji.emoji)" @keydown="onKeydown" tabindex="-1">
			<span class="emoji">{{ emoji.emoji }}</span>
			<span class="name" v-html="emoji.name.replace(q, `<b>${q}</b>`)"></span>
			<span class="alias" v-if="emoji.alias">({{ emoji.alias }})</span>
		</li>
	</ol>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as emojilib from 'emojilib';
import contains from '../../../common/scripts/contains';

const lib = Object.entries(emojilib.lib).filter((x: any) => {
	return x[1].category != 'flags';
});

const emjdb = lib.map((x: any) => ({
	emoji: x[1].char,
	name: x[0],
	alias: null
}));

lib.forEach((x: any) => {
	if (x[1].keywords) {
		x[1].keywords.forEach(k => {
			emjdb.push({
				emoji: x[1].char,
				name: k,
				alias: x[0]
			});
		});
	}
});

emjdb.sort((a, b) => a.name.length - b.name.length);

export default Vue.extend({
	props: ['type', 'q', 'textarea', 'complete', 'close', 'x', 'y'],
	data() {
		return {
			fetching: true,
			users: [],
			emojis: [],
			select: -1,
			emojilib
		}
	},
	computed: {
		items(): HTMLCollection {
			return (this.$refs.suggests as Element).children;
		}
	},
	updated() {
		//#region 位置調整
		const margin = 32;

		if (this.x + this.$el.offsetWidth > window.innerWidth - margin) {
			this.$el.style.left = (this.x - this.$el.offsetWidth) + 'px';
			this.$el.style.marginLeft = '-16px';
		} else {
			this.$el.style.left = this.x + 'px';
			this.$el.style.marginLeft = '0';
		}

		if (this.y + this.$el.offsetHeight > window.innerHeight - margin) {
			this.$el.style.top = (this.y - this.$el.offsetHeight) + 'px';
			this.$el.style.marginTop = '0';
		} else {
			this.$el.style.top = this.y + 'px';
			this.$el.style.marginTop = 'calc(1em + 8px)';
		}
		//#endregion
	},
	mounted() {
		this.textarea.addEventListener('keydown', this.onKeydown);

		Array.from(document.querySelectorAll('body *')).forEach(el => {
			el.addEventListener('mousedown', this.onMousedown);
		});

		this.$nextTick(() => {
			this.exec();

			this.$watch('q', () => {
				this.$nextTick(() => {
					this.exec();
				});
			});
		});
	},
	beforeDestroy() {
		this.textarea.removeEventListener('keydown', this.onKeydown);

		Array.from(document.querySelectorAll('body *')).forEach(el => {
			el.removeEventListener('mousedown', this.onMousedown);
		});
	},
	methods: {
		exec() {
			this.select = -1;
			if (this.$refs.suggests) {
				Array.from(this.items).forEach(el => {
					el.removeAttribute('data-selected');
				});
			}

			if (this.type == 'user') {
				const cache = sessionStorage.getItem(this.q);
				if (cache) {
					const users = JSON.parse(cache);
					this.users = users;
					this.fetching = false;
				} else {
					(this as any).api('users/search_by_username', {
						query: this.q,
						limit: 30
					}).then(users => {
						this.users = users;
						this.fetching = false;

						// キャッシュ
						sessionStorage.setItem(this.q, JSON.stringify(users));
					});
				}
			} else if (this.type == 'emoji') {
				const matched = [];
				emjdb.some(x => {
					if (x.name.indexOf(this.q) == 0 && !x.alias && !matched.some(y => y.emoji == x.emoji)) matched.push(x);
					return matched.length == 30;
				});
				if (matched.length < 30) {
					emjdb.some(x => {
						if (x.name.indexOf(this.q) == 0 && !matched.some(y => y.emoji == x.emoji)) matched.push(x);
						return matched.length == 30;
					});
				}
				if (matched.length < 30) {
					emjdb.some(x => {
						if (x.name.indexOf(this.q) > -1 && !matched.some(y => y.emoji == x.emoji)) matched.push(x);
						return matched.length == 30;
					});
				}
				this.emojis = matched;
			}
		},

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
					e.stopPropagation();
					this.textarea.focus();
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
@import '~const.styl'

.mk-autocomplete
	position fixed
	z-index 65535
	margin-top calc(1em + 8px)
	overflow hidden
	background #fff
	border solid 1px rgba(0, 0, 0, 0.1)
	border-radius 4px
	transition top 0.1s ease, left 0.1s ease

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
			color rgba(0, 0, 0, 0.8)

		.username
			color rgba(0, 0, 0, 0.3)

	> .emojis > li

		.emoji
			display inline-block
			margin 0 4px 0 0
			width 24px

		.name
			color rgba(0, 0, 0, 0.8)

		.alias
			margin 0 0 0 8px
			color rgba(0, 0, 0, 0.3)

</style>
