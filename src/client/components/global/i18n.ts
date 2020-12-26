import { h, Fragment, defineComponent } from 'vue';
import type { SetupContext, VNodeChild, RenderFunction } from 'vue';

export default defineComponent({
	props: {
		src: {
			type: String,
			required: true
		},
	},
	render() {
		// TODO
		return h('span', this.src);
	}
});
