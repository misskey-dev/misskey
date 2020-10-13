import { markRaw } from 'vue';
import * as os from '@/os';
import { onScrollTop, isTopVisible } from './scroll';

const SECOND_FETCH_LIMIT = 30;

export default (opts) => ({
	emits: ['queue'],

	data() {
		return {
			items: [],
			queue: [],
			offset: 0,
			fetching: true,
			moreFetching: false,
			inited: false,
			more: false,
			backed: false, // 遡り中か否か
			isBackTop: false,
			ilObserver: new IntersectionObserver(
				(entries) => entries.some((entry) => entry.isIntersecting)
					&& !this.moreFetching
					&& !this.fetching
					&& this.fetchMore()
				),
			loadMoreElement: null as Element,
		};
	},

	computed: {
		empty(): boolean {
			return this.items.length === 0 && !this.fetching && this.inited;
		},

		error(): boolean {
			return !this.fetching && !this.inited;
		},
	},

	watch: {
		pagination: {
			handler() {
				this.init();
			},
			deep: true
		},

		queue: {
			handler(a, b) {
				if (a.length === 0 && b.length === 0) return;
				this.$emit('queue', this.queue.length);
			},
			deep: true
		}
	},

	created() {
		opts.displayLimit = opts.displayLimit || 30;
		this.init();
	},

	activated() {
		this.isBackTop = false;
	},

	deactivated() {
		this.isBackTop = window.scrollY === 0;
	},

	mounted() {
		this.$nextTick(() => {
			if (this.$refs.loadMore) {
				this.loadMoreElement = this.$refs.loadMore instanceof Element ? this.$refs.loadMore : this.$refs.loadMore.$el;
				if (this.$store.state.device.enableInfiniteScroll) this.ilObserver.observe(this.loadMoreElement);
				this.loadMoreElement.addEventListener('click', this.fetchMore);
			}
		});
	},

	beforeUnmount() {
		this.ilObserver.disconnect();
		if (this.$refs.loadMore) this.loadMoreElement.removeEventListener('click', this.fetchMore);
	},

	methods: {
		reload() {
			this.items = [];
			this.init();
		},

		replaceItem(finder, data) {
			const i = this.items.findIndex(finder);
			this.items[i] = data;
		},

		removeItem(finder) {
			const i = this.items.findIndex(finder);
			this.items.splice(i, 1);
		},

		async init() {
			this.queue = [];
			this.fetching = true;
			if (opts.before) opts.before(this);
			let params = typeof this.pagination.params === 'function' ? this.pagination.params(true) : this.pagination.params;
			if (params && params.then) params = await params;
			if (params === null) return;
			const endpoint = typeof this.pagination.endpoint === 'function' ? this.pagination.endpoint() : this.pagination.endpoint;
			await os.api(endpoint, {
				...params,
				limit: this.pagination.noPaging ? (this.pagination.limit || 10) : (this.pagination.limit || 10) + 1,
			}).then(items => {
				for (const item of items) {
					markRaw(item);
				}
				if (!this.pagination.noPaging && (items.length > (this.pagination.limit || 10))) {
					items.pop();
					this.items = this.pagination.reversed ? [...items].reverse() : items;
					this.more = true;
				} else {
					this.items = this.pagination.reversed ? [...items].reverse() : items;
					this.more = false;
				}
				this.offset = items.length;
				this.inited = true;
				this.fetching = false;
				if (opts.after) opts.after(this, null);
			}, e => {
				this.fetching = false;
				if (opts.after) opts.after(this, e);
			});
		},

		async fetchMore() {
			if (!this.more || this.moreFetching || this.items.length === 0) return;
			this.moreFetching = true;
			this.backed = true;
			let params = typeof this.pagination.params === 'function' ? this.pagination.params(false) : this.pagination.params;
			if (params && params.then) params = await params;
			const endpoint = typeof this.pagination.endpoint === 'function' ? this.pagination.endpoint() : this.pagination.endpoint;
			await os.api(endpoint, {
				...params,
				limit: SECOND_FETCH_LIMIT + 1,
				...(this.pagination.offsetMode ? {
					offset: this.offset,
				} : this.pagination.reversed ? {
					sinceId: this.items[0].id,
				} : {
					untilId: this.items[this.items.length - 1].id,
				}),
			}).then(items => {
				for (const item of items) {
					markRaw(item);
				}
				if (items.length > SECOND_FETCH_LIMIT) {
					items.pop();
					this.items = this.pagination.reversed ? [...items].reverse().concat(this.items) : this.items.concat(items);
					this.more = true;
				} else {
					this.items = this.pagination.reversed ? [...items].reverse().concat(this.items) : this.items.concat(items);
					this.more = false;
				}
				this.offset += items.length;
				this.moreFetching = false;
			}, e => {
				this.moreFetching = false;
			});
		},

		prepend(item) {
			const isTop = this.isBackTop || (document.body.contains(this.$el) && isTopVisible(this.$el));

			if (isTop) {
				// Prepend the item
				this.items.unshift(item);

				// オーバーフローしたら古いアイテムは捨てる
				if (this.items.length >= opts.displayLimit) {
					this.items = this.items.slice(0, opts.displayLimit);
					this.more = true;
				}
			} else {
				this.queue.push(item);
				onScrollTop(this.$el, () => {
					for (const item of this.queue) {
						this.prepend(item);
					}
					this.queue = [];
				});
			}
		},

		append(item) {
			this.items.push(item);
		},
	}
});
