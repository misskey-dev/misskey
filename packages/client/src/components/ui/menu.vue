<template>
<div class="rrevdjwt" :class="{ center: align === 'center' }"
	:style="{ width: width ? width + 'px' : null }"
	ref="items"
	@contextmenu.self="e => e.preventDefault()"
	v-hotkey="keymap"
>
	<template v-for="(item, i) in _items">
		<div v-if="item === null" class="divider"></div>
		<span v-else-if="item.type === 'label'" class="label item">
			<span>{{ item.text }}</span>
		</span>
		<span v-else-if="item.type === 'pending'" :tabindex="i" class="pending item">
			<span><MkEllipsis/></span>
		</span>
		<MkA v-else-if="item.type === 'link'" :to="item.to" @click.passive="close()" :tabindex="i" class="_button item">
			<i v-if="item.icon" class="fa-fw" :class="item.icon"></i>
			<MkAvatar v-if="item.avatar" :user="item.avatar" class="avatar"/>
			<span>{{ item.text }}</span>
			<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
		</MkA>
		<a v-else-if="item.type === 'a'" :href="item.href" :target="item.target" :download="item.download" @click="close()" :tabindex="i" class="_button item">
			<i v-if="item.icon" class="fa-fw" :class="item.icon"></i>
			<span>{{ item.text }}</span>
			<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
		</a>
		<button v-else-if="item.type === 'user'" @click="clicked(item.action, $event)" :tabindex="i" class="_button item">
			<MkAvatar :user="item.user" class="avatar"/><MkUserName :user="item.user"/>
			<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
		</button>
		<button v-else @click="clicked(item.action, $event)" :tabindex="i" class="_button item" :class="{ danger: item.danger, active: item.active }" :disabled="item.active">
			<i v-if="item.icon" class="fa-fw" :class="item.icon"></i>
			<MkAvatar v-if="item.avatar" :user="item.avatar" class="avatar"/>
			<span>{{ item.text }}</span>
			<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
		</button>
	</template>
	<span v-if="_items.length === 0" class="none item">
		<span>{{ $ts.none }}</span>
	</span>
</div>
</template>

<script lang="ts">
import { defineComponent, ref, unref } from 'vue';
import { focusPrev, focusNext } from '@/scripts/focus';
import contains from '@/scripts/contains';

export default defineComponent({
	props: {
		items: {
			type: Array,
			required: true
		},
		viaKeyboard: {
			type: Boolean,
			required: false
		},
		align: {
			type: String,
			requried: false
		},
		width: {
			type: Number,
			required: false
		},
	},
	emits: ['close'],
	data() {
		return {
			_items: [],
		};
	},
	computed: {
		keymap(): any {
			return {
				'up|k|shift+tab': this.focusUp,
				'down|j|tab': this.focusDown,
				'esc': this.close,
			};
		},
	},
	watch: {
		items: {
			handler() {
				const items = ref(unref(this.items).filter(item => item !== undefined));

				for (let i = 0; i < items.value.length; i++) {
					const item = items.value[i];
					
					if (item && item.then) { // if item is Promise
						items.value[i] = { type: 'pending' };
						item.then(actualItem => {
							items.value[i] = actualItem;
						});
					}
				}

				this._items = items;
			},
			immediate: true
		}
	},
	mounted() {
		if (this.viaKeyboard) {
			this.$nextTick(() => {
				focusNext(this.$refs.items.children[0], true, false);
			});
		}

		if (this.contextmenuEvent) {
			this.$el.style.top = this.contextmenuEvent.pageY + 'px';
			this.$el.style.left = this.contextmenuEvent.pageX + 'px';

			for (const el of Array.from(document.querySelectorAll('body *'))) {
				el.addEventListener('mousedown', this.onMousedown);
			}
		}
	},
	beforeUnmount() {
		for (const el of Array.from(document.querySelectorAll('body *'))) {
			el.removeEventListener('mousedown', this.onMousedown);
		}
	},
	methods: {
		clicked(fn, ev) {
			fn(ev);
			this.close();
		},
		close() {
			this.$emit('close');
		},
		focusUp() {
			focusPrev(document.activeElement);
		},
		focusDown() {
			focusNext(document.activeElement);
		},
		onMousedown(e) {
			if (!contains(this.$el, e.target) && (this.$el != e.target)) this.close();
		},
	}
});
</script>

<style lang="scss" scoped>
.rrevdjwt {
	padding: 8px 0;
	min-width: 200px;
	max-height: 90vh;
	overflow: auto;

	&.center {
		> .item {
			text-align: center;
		}
	}

	> .item {
		display: block;
		position: relative;
		padding: 8px 18px;
		width: 100%;
		box-sizing: border-box;
		white-space: nowrap;
		font-size: 0.9em;
		line-height: 20px;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;

		&:before {
			content: "";
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			margin: auto;
			width: calc(100% - 16px);
			height: 100%;
			border-radius: 6px;
		}

		> * {
			position: relative;
		}

		&.danger {
			color: #ff2a2a;

			&:hover {
				color: #fff;

				&:before {
					background: #ff4242;
				}
			}

			&:active {
				color: #fff;

				&:before {
					background: #d42e2e;
				}
			}
		}

		&.active {
			color: var(--fgOnAccent);
			opacity: 1;

			&:before {
				background: var(--accent);
			}
		}

		&:not(:disabled):hover {
			color: var(--accent);
			text-decoration: none;

			&:before {
				background: var(--accentedBg);
			}
		}

		&:not(:active):focus-visible {
			box-shadow: 0 0 0 2px var(--focus) inset;
		}

		&.label {
			pointer-events: none;
			font-size: 0.7em;
			padding-bottom: 4px;

			> span {
				opacity: 0.7;
			}
		}

		&.pending {
			pointer-events: none;
			opacity: 0.7;
		}

		&.none {
			pointer-events: none;
			opacity: 0.7;
		}

		> i {
			margin-right: 5px;
			width: 20px;
		}

		> .avatar {
			margin-right: 5px;
			width: 20px;
			height: 20px;
		}

		> .indicator {
			position: absolute;
			top: 5px;
			left: 13px;
			color: var(--indicator);
			font-size: 12px;
			animation: blink 1s infinite;
		}
	}

	> .divider {
		margin: 8px 0;
		height: 1px;
		background: var(--divider);
	}
}
</style>
