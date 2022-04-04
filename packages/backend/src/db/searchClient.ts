import sonic from "./sonic";
import es from "./elasticsearch";

// This file is just to make it easier to add new drivers in the future, simply import searchClient and whatever driver is available is used

export const clients = [sonic, es];

const searchClient =
	clients.find((client) => client && client.available) || null;

export default searchClient;
