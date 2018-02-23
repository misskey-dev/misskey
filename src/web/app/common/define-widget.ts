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
			}
		},
		computed: {
			id(): string {
				return this.widget.id;
			}
		},
		data() {
			return {
				props: data.props ? data.props() : {} as T
			};
		},
		created() {
			if (this.props) {
				Object.keys(this.props).forEach(prop => {
					if (this.widget.data.hasOwnProperty(prop)) {
						this.props[prop] = this.widget.data[prop];
					}
				});
			}

			this.$watch('props', newProps => {
				if (this.isMobile) {
					(this as any).api('i/update_mobile_home', {
						id: this.id,
						data: newProps
					}).then(() => {
						(this as any).os.i.client_settings.mobile_home.find(w => w.id == this.id).data = newProps;
					});
				} else {
					(this as any).api('i/update_home', {
						id: this.id,
						data: newProps
					}).then(() => {
						(this as any).os.i.client_settings.home.find(w => w.id == this.id).data = newProps;
					});
				}
			}, {
				deep: true
			});
		}
	});
}
