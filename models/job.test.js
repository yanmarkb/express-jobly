"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app.js");
const Job = require("./job.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
} = require("./_testCommon.js");

let jobId;
let jobIds;

beforeAll(async function () {
	jobIds = await commonBeforeAll();
	jobId = jobIds[0];
});

beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);
describe("create job", function () {
	const newJob = {
		title: "new",
		salary: 100,
		equity: "0.1",
		company_handle: "c1",
	};

	test("works", async function () {
		let job = await Job.create(newJob);
		expect(job).toEqual({
			...newJob,
			id: expect.any(Number),
		});
	});

	test("bad request with dupe", async function () {
		try {
			await Job.create(newJob);
			await Job.create(newJob);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe("findAll", function () {
	test("works", async function () {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
			{
				id: expect.any(Number),
				title: "j1",
				salary: 100,
				equity: "0.1",
				company_handle: "c1",
			},
			{
				id: expect.any(Number),
				title: "j2",
				salary: 200,
				equity: "0.2",
				company_handle: "c2",
			},
			{
				id: expect.any(Number),
				title: "j3",
				salary: 300,
				equity: "0.3",
				company_handle: "c3",
			},
		]);
	});
});

describe("get", function () {
	test("works", async function () {
		let job = await Job.get(jobId);
		expect(job).toEqual({
			id: jobId,
			title: "j1",
			salary: 100,
			equity: "0.1",
			company_handle: "c1",
		});
	});

	test("not found if no such job", async function () {
		try {
			await Job.get(999);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("update", function () {
	const updateData = {
		title: "New",
		salary: 200,
		equity: "0.2",
	};

	test("works", async function () {
		let job = await Job.update(jobId, updateData);
		expect(job).toEqual({
			id: jobId,
			company_handle: "c1",
			...updateData,
		});
	});

	test("works: null fields", async function () {
		const updateDataSetNulls = {
			title: "New",
			salary: null,
			equity: null,
		};

		let job = await Job.update(jobId, updateDataSetNulls);
		expect(job).toEqual({
			id: jobId,
			company_handle: "c1",
			...updateDataSetNulls,
		});
	});

	test("not found if no such job", async function () {
		try {
			await Job.update(999, updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test("bad request with no data", async function () {
		try {
			await Job.update(jobId, {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe("remove", function () {
	test("works", async function () {
		await Job.remove(jobId);
		const res = await db.query("SELECT id FROM jobs WHERE id=1");
		expect(res.rows.length).toEqual(0);
	});

	test("not found if no such job", async function () {
		try {
			await Job.remove(999);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
