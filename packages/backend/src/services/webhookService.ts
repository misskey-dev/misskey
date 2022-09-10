import { Container, Service } from 'typedi';
import { FooService } from './fooService.js';

@Injectable()
export class WebhookService {
	constructor(
		private fooService: FooService,
	) {}

	public deliver() {
		this.fooService.foo();
		console.log('delivered');
	}
}
