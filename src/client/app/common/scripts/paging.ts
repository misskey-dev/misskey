import Vue from 'vue';

export default (opts) => ({
	data() {
		return {
			items: [],
			queue: [],
			offset: 0,
			fetching: true,
			moreFetching: false,
			inited: false,
			more: false
		};
	},

	computed: {
		empty(): boolean {
			return this.items.length == 0 && !this.fetching && this.inited;
		},

		error(): boolean {
			return !this.fetching && !this.inited;
		}
	},

	watch: {
		queue(x) {
			if (opts.onQueueChanged) opts.onQueueChanged(this, x);
		},

		pagination() {
			this.init();
		}
	},

	created() {
		opts.displayLimit = opts.displayLimit || 30;
		this.init();
	},

	mounted() {
		if (opts.captureWindowScroll) {
			this.isScrollTop = () => {
				return window.scrollY <= 8;
			};

			window.addEventListener('scroll', this.onScroll, { passive: true });
		} else if (opts.isContainer) {
			this.isScrollTop = () => {
				return this.$el.scrollTop <= 8;
			};

			this.$el.addEventListener('scroll', this.onScroll, { passive: true });
		}
	},

	beforeDestroy() {
		if (opts.captureWindowScroll) {
			window.removeEventListener('scroll', this.onScroll);
		} else if (opts.isContainer) {
			this.$el.removeEventListener('scroll', this.onScroll);
		}
	},

	methods: {
		updateItem(i, item) {
			Vue.set((this as any).items, i, item);
		},

		reload() {
			this.queue = [];
			this.items = [];
			this.init();
		},

		async init() {
			this.fetching = true;
			if (opts.beforeInit) opts.beforeInit(this);
			let params = typeof this.pagination.params === 'function' ? this.pagination.params(true) : this.pagination.params;
			if (params && params.then) params = await params;
			await this.$root.api(this.pagination.endpoint, {
				limit: (this.pagination.limit || 10) + 1,
				...params
			}).then(x => {
				if (x.length == (this.pagination.limit || 10) + 1) {
					x.pop();
					this.items = x;
					this.more = true;
				} else {
					this.items = x;
					this.more = false;
				}
				this.offset = x.length;
				this.inited = true;
				this.fetching = false;
				if (opts.onInited) opts.onInited(this);
			}, e => {
				this.fetching = false;
				if (opts.onInited) opts.onInited(this);
			});
		},

		async fetchMore() {
			if (!this.more || this.moreFetching || this.items.length === 0) return;
			this.moreFetching = true;
			let params = typeof this.pagination.params === 'function' ? this.pagination.params(false) : this.pagination.params;
			if (params && params.then) params = await params;
			await this.$root.api(this.pagination.endpoint, {
				limit: (this.pagination.limit || 10) + 1,
				...(this.pagination.endpoint === 'notes/search' ? {
					offset: this.offset,
				} : {
					untilId: this.items[this.items.length - 1].id,
				}),
				...params
			}).then(x => {
				if (x.length == (this.pagination.limit || 10) + 1) {
					x.pop();
					this.items = this.items.concat(x);
					this.more = true;
				} else {
					this.items = this.items.concat(x);
					this.more = false;
				}
				this.offset += x.length;
				this.moreFetching = false;
			}, e => {
				this.moreFetching = false;
			});
		},

		prepend(item, silent = false) {
			if (opts.onPrepend) {
				const cancel = opts.onPrepend(this, item, silent);
				if (cancel) return;
			}

			if (this.isScrollTop == null || this.isScrollTop()) {
				// Prepend the item
				this.items.unshift(item);

				// オーバーフローしたら古い投稿は捨てる
				if (this.items.length >= opts.displayLimit) {
					this.items = this.items.slice(0, opts.displayLimit);
					this.more = true;
				}
			} else {
				this.queue.push(item);
			}
		},

		append(item) {
			this.items.push(item);
		},

		releaseQueue() {
			for (const n of this.queue) {
				this.prepend(n, true);
			}
			this.queue = [];
		},

		onScroll() {
			if (this.isScrollTop()) {
				this.onTop();
			}

			if (this.$store.state.settings.fetchOnScroll) {
				// 親要素が display none だったら弾く
				// https://github.com/syuilo/misskey/issues/1569
				// http://d.hatena.ne.jp/favril/20091105/1257403319
				if (this.$el.offsetHeight == 0) return;

				const bottomPosition = opts.isContainer ? this.$el.scrollHeight : document.body.offsetHeight;

				const currentBottomPosition = opts.isContainer ? this.$el.scrollTop + this.$el.clientHeight : window.scrollY + window.innerHeight;
				if (currentBottomPosition > (bottomPosition - 8)) this.onBottom();
			}
		},

		onTop() {
			this.releaseQueue();
		},

		onBottom() {
			this.fetchMore();
		}
	}
});
