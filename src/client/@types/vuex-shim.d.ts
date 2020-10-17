import { ComponentCustomProperties } from 'vue';
import { Store } from 'vuex';

declare module '@vue/runtime-core' {

	// tslint:disable-next-line:no-empty-interface
	interface State {
	}

	interface ComponentCustomProperties {
		$store: Store<State>;
	}
}
