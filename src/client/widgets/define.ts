import { defineComponent } from 'vue';
import { Form } from '@/scripts/form';

export default function <T extends Form>(data: {
	name: string;
	props?: () => T;
}) {
	return defineComponent({
		props: {
			widget: {
				type: Object,
				required: false
			},
		},

		computed: {
			id(): string {
				return this.widget ? this.widget.id : null;
			},

			props(): Record<string, any> {
				return this.widget ? this.widget.data : {};
			}
		},

		created() {
			this.mergeProps();

			this.$watch('props', () => {
				this.mergeProps();
			}, { deep: true });
		},

		methods: {
			mergeProps() {
				if (data.props) {
					const defaultProps = data.props();
					for (const prop of Object.keys(defaultProps)) {
						if (this.props.hasOwnProperty(prop)) continue;
						this.props[prop] = defaultProps[prop].default;
					}
				}
			},

			async setting() {
				const form = data.props();
				for (const item of Object.keys(form)) {
					form[item].default = this.props[item];
				}
				const { canceled, result } = await os.form(data.name, form);
				if (canceled) return;

				for (const key of Object.keys(result)) {
					this.props[key] = result[key];
				}

				this.save();
			},

			save() {
				if (this.widget) {
					this.$store.commit('deviceUser/updateWidget', this.widget);
				}
			}
		}
	});
}
