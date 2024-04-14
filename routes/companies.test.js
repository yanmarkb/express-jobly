"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /companies", function () {
	const newCompany = {
		handle: "new",
		name: "New",
		logoUrl: "http://new.img",
		description: "DescNew",
		numEmployees: 10,
	};

	test("ok for users", async function () {
		const resp = await request(app)
			.post("/companies")
			.send(newCompany)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			company: newCompany,
		});
	});

	test("bad request with missing data", async function () {
		const resp = await request(app)
			.post("/companies")
			.send({
				handle: "new",
				numEmployees: 10,
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request with invalid data", async function () {
		const resp = await request(app)
			.post("/companies")
			.send({
				...newCompany,
				logoUrl: "not-a-url",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /companies */

describe("GET /companies", function () {
	test("ok for anon", async function () {
		const resp = await request(app).get("/companies");
		expect(resp.body).toEqual({
			companies: [
				{
					handle: "c1",
					name: "C1",
					description: "Desc1",
					numEmployees: 1,
					logoUrl: "http://c1.img",
				},
				{
					handle: "c2",
					name: "C2",
					description: "Desc2",
					numEmployees: 2,
					logoUrl: "http://c2.img",
				},
				{
					handle: "c3",
					name: "C3",
					description: "Desc3",
					numEmployees: 3,
					logoUrl: "http://c3.img",
				},
			],
		});
	});

	test("fails: test next() handler", async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query("DROP TABLE companies CASCADE");
		const resp = await request(app)
			.get("/companies")
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});

	// Add a test to check if the filter works

	// This test checks if the route correctly returns all companies when no filters are applied
	test("works: no filters", async function () {
		// Send a GET request to the "/companies" route
		const resp = await request(app).get("/companies");
		// Check if the response body is an object with a `companies` property that is an array containing all companies
		expect(resp.body).toEqual({
			companies: [
				// The expected data for the first company
				{
					handle: "c1",
					name: "C1",
					description: "Desc1",
					numEmployees: 1,
					logoUrl: "http://c1.img",
				},
				// The expected data for the second company
				{
					handle: "c2",
					name: "C2",
					description: "Desc2",
					numEmployees: 2,
					logoUrl: "http://c2.img",
				},
				// The expected data for the third company
				{
					handle: "c3",
					name: "C3",
					description: "Desc3",
					numEmployees: 3,
					logoUrl: "http://c3.img",
				},
			],
		});
	});

	// This test checks if the route correctly filters companies based on the `name` query parameter
	test("works: with name filter", async function () {
		// Send a GET request to the "/companies" route with a `name` query parameter of "c1"
		const resp = await request(app).get("/companies?name=c1");
		// Check if the response body is an object with a `companies` property that is an array containing a single company object with the specified name
		expect(resp.body).toEqual({
			companies: [
				{
					handle: "c1",
					name: "C1",
					description: "Desc1",
					numEmployees: 1,
					logoUrl: "http://c1.img",
				},
			],
		});
	});

	// This test checks if the route correctly filters companies based on the `minEmployees` query parameter
	test("works: with minEmployees filter", async function () {
		// Send a GET request to the "/companies" route with a `minEmployees` query parameter of 2
		const resp = await request(app).get("/companies?minEmployees=2");
		// Check if the response body is an object with a `companies` property that is an array containing company objects with a `numEmployees` property greater than or equal to 2
		expect(resp.body).toEqual({
			companies: [
				{
					handle: "c2",
					name: "C2",
					description: "Desc2",
					numEmployees: 2,
					logoUrl: "http://c2.img",
				},
				{
					handle: "c3",
					name: "C3",
					description: "Desc3",
					numEmployees: 3,
					logoUrl: "http://c3.img",
				},
			],
		});
	});

	// This test checks if the route correctly filters companies based on the `maxEmployees` query parameter
	test("works: with maxEmployees filter", async function () {
		// Send a GET request to the "/companies" route with a `maxEmployees` query parameter of 2
		const resp = await request(app).get("/companies?maxEmployees=2");
		// Check if the response body is an object with a `companies` property that is an array containing company objects with a `numEmployees` property less than or equal to 2
		expect(resp.body).toEqual({
			companies: [
				{
					handle: "c1",
					name: "C1",
					description: "Desc1",
					numEmployees: 1,
					logoUrl: "http://c1.img",
				},
				{
					handle: "c2",
					name: "C2",
					description: "Desc2",
					numEmployees: 2,
					logoUrl: "http://c2.img",
				},
			],
		});
	});

	// This test checks if the route correctly filters companies based on the `name` and `minEmployees` query parameters
	test("works: with name and minEmployees filter", async function () {
		// Send a GET request to the "/companies" route with a `name` query parameter of "c" and a `minEmployees` query parameter of 2
		const resp = await request(app).get("/companies?name=c&minEmployees=2");
		// Check if the response body is an object with a `companies` property that is an array containing company objects with a `name` property that includes "c" and a `numEmployees` property greater than or equal to 2
		expect(resp.body).toEqual({
			companies: [
				{
					handle: "c2",
					name: "C2",
					description: "Desc2",
					numEmployees: 2,
					logoUrl: "http://c2.img",
				},
				{
					handle: "c3",
					name: "C3",
					description: "Desc3",
					numEmployees: 3,
					logoUrl: "http://c3.img",
				},
			],
		});
	});

	// This test checks if the route correctly throws an error when the `minEmployees` query parameter is greater than the `maxEmployees` query parameter
	test("throws BadRequestError: if minEmployees > maxEmployees", async function () {
		// Send a GET request to the "/companies" route with a `minEmployees` query parameter of 3 and a `maxEmployees` query parameter of 2
		const resp = await request(app).get(
			"/companies?minEmployees=3&maxEmployees=2"
		);
		// Check if the response status code is 400, indicating a bad request error
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
	test("works for anon", async function () {
		const resp = await request(app).get(`/companies/c1`);
		expect(resp.body).toEqual({
			company: {
				handle: "c1",
				name: "C1",
				description: "Desc1",
				numEmployees: 1,
				logoUrl: "http://c1.img",
			},
		});
	});

	test("works for anon: company w/o jobs", async function () {
		const resp = await request(app).get(`/companies/c2`);
		expect(resp.body).toEqual({
			company: {
				handle: "c2",
				name: "C2",
				description: "Desc2",
				numEmployees: 2,
				logoUrl: "http://c2.img",
			},
		});
	});

	test("not found for no such company", async function () {
		const resp = await request(app).get(`/companies/nope`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
	test("works for users", async function () {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				name: "C1-new",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			company: {
				handle: "c1",
				name: "C1-new",
				description: "Desc1",
				numEmployees: 1,
				logoUrl: "http://c1.img",
			},
		});
	});

	test("unauth for anon", async function () {
		const resp = await request(app).patch(`/companies/c1`).send({
			name: "C1-new",
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("not found on no such company", async function () {
		const resp = await request(app)
			.patch(`/companies/nope`)
			.send({
				name: "new nope",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request on handle change attempt", async function () {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				handle: "c1-new",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request on invalid data", async function () {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				logoUrl: "not-a-url",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** DELETE /companies/:handle */

describe("DELETE /companies/:handle", function () {
	test("works for users", async function () {
		const resp = await request(app)
			.delete(`/companies/c1`)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({ deleted: "c1" });
	});

	test("unauth for anon", async function () {
		const resp = await request(app).delete(`/companies/c1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found for no such company", async function () {
		const resp = await request(app)
			.delete(`/companies/nope`)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});
