import Vue from 'vue';

export default function<T extends object>(data: {
	name: string;
	props?: () => T;
}) {
	return Vue.extend({
		props: {
			widget: {
				type: Object
			},
			isMobile: {
				type: Boolean,
				default: false
			},
			isCustomizeMode: {
				type: Boolean,
				default: false
			}
		},

		computed: {
			id(): string {
				return this.widget.id;
			},

			props(): T {
				return this.widget.data;
			}
		},

		data() {
			return {
				bakedOldProps: null
			};
		},

		created() {
			this.mergeProps();

			this.$watch('props', () => {
				this.mergeProps();
			});

			this.bakeProps();
		},

		methods: {
			bakeProps() {
				this.bakedOldProps = JSON.stringify(this.props);
			},

			mergeProps() {
				if (data.props) {
					const defaultProps = data.props();
					Object.keys(defaultProps).forEach(prop => {
						if (!this.props.hasOwnProperty(prop)) {
							Vue.set(this.props, prop, defaultProps[prop]);
						}
					});
				}
			},

			save() {
				if (this.bakedOldProps == JSON.stringify(this.props)) return;

				this.bakeProps();

				if (this.isMobile) {
					(this as any).api('i/update_mobile_home', {
						id: this.id,
						data: this.props
					});
				} else {
					(this as any).api('i/update_home', {
						id: this.id,
						data: this.props
					});
				}
			}
		}
	});
}
