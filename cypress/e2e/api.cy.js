describe('API', () => {
	it('returns HTTP 400 to invalid API endpoint paths', () => {
		cy.request({
			url: '/api/foo',
			failOnStatusCode: false,
		}).then((response) => {
			expect(response.status).to.eq(400);
			expect(response.body.error.code).to.eq('INVALID_API_ENDPOINT');
		});
	});
});
