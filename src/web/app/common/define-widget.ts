import Vue from 'vue';

export default function(data: {
	name: string;
	props: any;
}) {
	return Vue.extend({
		props: {
			wid: {
				type: String,
				required: true
			},
			place: {
				type: String,
				required: true
			},
			wprops: {
				type: Object,
				required: false
			}
		},
		computed: {
			id(): string {
				return this.wid;
			}
		},
		data() {
			return {
				props: data.props
			};
		},
		watch: {
			props(newProps, oldProps) {
				if (JSON.stringify(newProps) == JSON.stringify(oldProps)) return;
				this.$root.$data.os.api('i/update_home', {
					id: this.id,
					data: newProps
				}).then(() => {
					this.$root.$data.os.i.client_settings.home.find(w => w.id == this.id).data = newProps;
				});
			}
		},
		created() {
			if (this.props) {
				Object.keys(this.wprops).forEach(prop => {
					this.props[prop] = this.props.data.hasOwnProperty(prop) ? this.props.data[prop] : this.props[prop];
				});
			}
		}
	});
}
