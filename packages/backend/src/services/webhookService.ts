import { Container, Service } from 'typedi';

@Service()
export class WebhookService {
	constructor(

	) {}

	public deliver() {
		console.log('delivered');
	}
}
