const RegistrationTicket = db.get<IRegistrationTicket>('registrationTickets');
RegistrationTicket.createIndex('code', { unique: true });
export default RegistrationTicket;

export interface IRegistrationTicket {
	id: mongo.ObjectID;
	createdAt: Date;
	code: string;
}
