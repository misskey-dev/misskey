describe('API', () => {
	it('returns HTTP 404 to unknown API endpoint paths', () => {
		cy.request({
			url: '/api/foo',
			failOnStatusCode: false,
		}).then((response) => {
			expect(response.status).to.eq(404);
			expect(response.body.error.code).to.eq('UNKNOWN_API_ENDPOINT');
		});
	});
});
