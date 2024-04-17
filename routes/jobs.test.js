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
	adminToken,
	testJobIds,
} = require("../routes/_testCommon");

// let testJobIds = [];

// const firstJobId = testJobIds;
// console.log("firstJobId", firstJobId);

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /jobs", function () {
	const newJob = {
		title: "new",
		salary: 50000,
		equity: 0.1,
		company_handle: "c1",
	};

	test("ok for admin", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob)
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		let jobId = resp.body.job.id;
		expect(resp.body).toEqual({
			job: {
				...newJob,
				id: jobId, //grabs the right id
				equity: newJob.equity.toString(), // convert equity to string
			},
		});
	});

	test("bad request with missing data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				salary: 50000,
				equity: 0.1,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

// test("creates a new job and returns it", async () => {
// 	// Setup: create the necessary company
// 	const newCompany = {
// 		handle: "test",
// 		name: "Test Company",
// 		// Add other necessary fields for a company
// 	};
// 	await request(app)
// 		.post("/companies")
// 		.send(newCompany)
// 		.set("authorization", `Bearer ${adminToken}`);

// 	// Now create the job
// 	const newJob = {
// 		title: "Test Job",
// 		salary: 50000,
// 		equity: 0.1,
// 		company_handle: "test",
// 	};
// 	const response = await request(app)
// 		.post("/jobs")
// 		.send(newJob)
// 		.set("authorization", `Bearer ${adminToken}`);
// 	console.log("response.body:", response.body);
// 	expect(response.statusCode).toBe(201);
// 	expect(response.body).toEqual({ job: newJob });
// });

describe("GET /jobs", function () {
	test("ok for anon", async function () {
		const resp = await request(app).get("/jobs");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "Job1",
					salary: 100000,
					equity: "0.1",
					company_handle: "c1",
				},
				{
					id: expect.any(Number),
					title: "Job2",
					salary: 200000,
					equity: "0.2",
					company_handle: "c2",
				},
				{
					id: expect.any(Number),
					title: "Job3",
					salary: 300000,
					equity: "0.3",
					company_handle: "c3",
				},
			],
		});
	});

	// New tests for filtering functionality
	test("ok: filtering by title", async function () {
		const resp = await request(app).get("/jobs").query({ title: "Job1" });
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "Job1",
					salary: expect.any(Number),
					equity: expect.any(String),
					company_handle: expect.any(String),
				},
			],
		});
	});

	test("ok: filtering by minSalary", async function () {
		const resp = await request(app).get("/jobs").query({ minSalary: 300000 });
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: expect.any(String),
					salary: expect.any(Number),
					equity: expect.any(String),
					company_handle: expect.any(String),
				},
			],
		});
	});

	test("ok: filtering by hasEquity", async function () {
		const resp = await request(app).get("/jobs").query({ hasEquity: true });
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: expect.any(String),
					salary: expect.any(Number),
					equity: expect.any(String),
					company_handle: expect.any(String),
				},
				{
					id: expect.any(Number),
					title: expect.any(String),
					salary: expect.any(Number),
					equity: expect.any(String),
					company_handle: expect.any(String),
				},
				{
					id: expect.any(Number),
					title: expect.any(String),
					salary: expect.any(Number),
					equity: expect.any(String),
					company_handle: expect.any(String),
				},
			],
		});
	});

	test("ok: filtering by multiple parameters", async function () {
		const resp = await request(app)
			.get("/jobs")
			.query({ title: "Job3", minSalary: 300000, hasEquity: true });
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "Job3",
					salary: expect.any(Number),
					equity: expect.any(String),
					company_handle: expect.any(String),
				},
			],
		});
	});
});

describe("GET /jobs/:id", function () {
	test("works for anon", async function () {
		const result = await db.query("SELECT * FROM jobs ORDER BY id LIMIT 1");
		console.log("result.rows[0]:", result.rows[0]);
		const job = result.rows[0];

		const resp = await request(app).get(`/jobs/${job.id}`);
		expect(resp.body).toEqual({
			job: {
				id: job.id,
				title: "Job1",
				salary: 100000,
				equity: "0.1",
				company_handle: "c1",
			},
		});
	});
});

describe("PATCH /jobs/:id", function () {
	test("works for admin", async function () {
		// Query the database to get the first job
		const result = await db.query(`SELECT * FROM jobs ORDER BY id LIMIT 1`);
		const job = result.rows[0];

		const resp = await request(app)
			.patch(`/jobs/${job.id}`)
			.send({
				title: "Updated",
				salary: 60000,
				equity: 0.2,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			job: {
				id: job.id,
				title: "Updated",
				salary: 60000,
				equity: "0.2",
				company_handle: job.company_handle,
			},
		});
	});

	test("bad request with missing data", async function () {
		// Query the database to get the first job
		const result = await db.query(`SELECT * FROM jobs ORDER BY id LIMIT 1`);
		const job = result.rows[0];

		const resp = await request(app)
			.patch(`/jobs/${job.id}`)
			.send({
				salary: 60000,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});
describe("DELETE /jobs/:id", function () {
	test("works for admin", async function () {
		const result = await db.query(`SELECT * FROM jobs ORDER BY id LIMIT 1`);
		const job = result.rows[0];

		const resp = await request(app)
			.delete(`/jobs/${job.id}`)
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({ deleted: `${job.id}` });
	});
});
