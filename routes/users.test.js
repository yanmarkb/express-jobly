"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");
//Import new adminToken from _testCommon.js
const { adminToken } = require("./_testCommon");
//imported new admin or self token from _testCommon.js
const { adminOrSelfToken } = require("./_testCommon");
//Import new ensureAdminOrSelf from auth.js
const { ensureAdminOrSelf } = require("../middleware/auth");
const { testJobIds } = require("./_testCommon");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	// testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
	test("works for users: create non-admin", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "new@email.com",
				isAdmin: false,
			})
			.set("authorization", `Bearer ${adminToken}`); //changed to adminToken
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			user: {
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				email: "new@email.com",
				isAdmin: false,
			},
			token: expect.any(String),
		});
	});

	test("works for users: create admin", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "new@email.com",
				isAdmin: true,
			})
			.set("authorization", `Bearer ${adminToken}`); //changed to adminToken
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			user: {
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				email: "new@email.com",
				isAdmin: true,
			},
			token: expect.any(String),
		});
	});

	test("unauth for anon", async function () {
		const resp = await request(app).post("/users").send({
			username: "u-new",
			firstName: "First-new",
			lastName: "Last-newL",
			password: "password-new",
			email: "new@email.com",
			isAdmin: true,
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("bad request if missing data", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
			})
			.set("authorization", `Bearer ${adminToken}`); //changed to adminToken
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request if invalid data", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "not-an-email",
				isAdmin: true,
			})
			.set("authorization", `Bearer ${adminToken}`); //changed to adminToken
		expect(resp.statusCode).toEqual(400);
	});
	//added test to check if a non-admin user gets an unauthorized error when trying to create a new user
	test("unauth for non-admin users", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "new@email.com",
				isAdmin: true,
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});
});

/************************************** POST /users/:username/jobs/:id */

describe("POST /users/:username/jobs/:id", function () {
	test("works for users", async function () {
		// Query the database to get the ID of the first job
		const jobRes = await db.query(`SELECT id FROM jobs LIMIT 1`);
		const jobId = jobRes.rows[0].id;

		// Make the request
		const resp = await request(app)
			.post(`/users/u1/jobs/${jobId}`)
			.set("authorization", `Bearer ${u1Token}`);

		console.log(resp.statusCode);
		console.log(resp.body);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({ applied: jobId.toString() });
	});

	test("unauth for anon", async function () {
		// Query the database to get the ID of the first job
		const jobRes = await db.query(`SELECT id FROM jobs LIMIT 1`);
		const jobId = jobRes.rows[0].id;

		// Use the job ID in the request
		const resp = await request(app).post(`/users/u1/jobs/${jobId}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if no such user", async function () {
		const resp = await request(app)
			.post("/no-such-user/jobs/1")
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("not found if no such job", async function () {
		const resp = await request(app)
			.post("/u1/jobs/0")
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** GET /users */

describe("GET /users", function () {
	test("works for users", async function () {
		const resp = await request(app)
			.get("/users")
			.set("authorization", `Bearer ${adminToken}`); //changed to adminToken
		expect(resp.body).toEqual({
			users: expect.arrayContaining([
				expect.objectContaining({
					username: "admin",
					firstName: "AdminF",
					lastName: "AdminL",
					email: "admin@user.com",
					isAdmin: true,
				}),
				expect.objectContaining({
					username: "u1",
					firstName: "U1F",
					lastName: "U1L",
					email: "user1@user.com",
					isAdmin: false,
				}),
				expect.objectContaining({
					username: "u2",
					firstName: "U2F",
					lastName: "U2L",
					email: "user2@user.com",
					isAdmin: false,
				}),
				expect.objectContaining({
					username: "u3",
					firstName: "U3F",
					lastName: "U3L",
					email: "user3@user.com",
					isAdmin: false,
				}),
			]),
		});
	});
	//added test to check if a non-admin user gets an unauthorized error when trying to get all users
	test("unauth for non-admin users", async function () {
		const resp = await request(app)
			.get("/users")
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).get("/users");
		expect(resp.statusCode).toEqual(401);
	});

	test("fails: test next() handler", async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query("DROP TABLE users CASCADE");
		const resp = await request(app)
			.get("/users")
			.set("authorization", `Bearer ${adminToken}`); //changed to adminToken
		expect(resp.statusCode).toEqual(500);
	});
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
	//changed to adminToken
	test("works for admin", async function () {
		const resp = await request(app)
			.get(`/users/u1`)
			.set("authorization", `Bearer ${adminToken}`); //changed to adminToken
		expect(resp.body).toEqual({
			user: expect.objectContaining({
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
			}),
		});
	});
	//added a self check to see if a user can get their own information
	describe("GET /users/:username", function () {
		test("works for self", async function () {
			const resp = await request(app)
				.get(`/users/u1`)
				.set("authorization", `Bearer ${adminOrSelfToken}`); //changed to adminOrSelfToken
			expect(resp.body).toEqual({
				user: expect.objectContaining({
					username: "u1",
					firstName: "U1F",
					lastName: "U1L",
					email: "user1@user.com",
					isAdmin: false,
				}),
			});
		});

		test("works for admin", async function () {
			const resp = await request(app)
				.get(`/users/u1`)
				.set("authorization", `Bearer ${adminOrSelfToken}`); //changed to adminOrSelfToken
			expect(resp.body).toEqual({
				user: expect.objectContaining({
					username: "u1",
					firstName: "U1F",
					lastName: "U1L",
					email: "user1@user.com",
					isAdmin: false,
				}),
			});
		});
	});

	test("unauth for anon", async function () {
		const resp = await request(app).get(`/users/u1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if user not found", async function () {
		const resp = await request(app)
			.get(`/users/nope`)
			.set("authorization", `Bearer ${adminToken}`); //changed to adminToken
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
	test("works for users", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: "New",
			})
			.set("authorization", `Bearer ${adminOrSelfToken}`); //changed to adminOrSelfToken
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "New",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
			},
		});
	});

	test("works for admins", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: "New",
			})
			.set("authorization", `Bearer ${adminOrSelfToken}`); //changed to adminOrSelfToken
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "New",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
			},
		});
	});

	test("unauth for anon", async function () {
		const resp = await request(app).patch(`/users/u1`).send({
			firstName: "New",
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if no such user", async function () {
		const resp = await request(app)
			.patch(`/users/nope`)
			.send({
				firstName: "Nope",
			})
			.set("authorization", `Bearer ${adminOrSelfToken}`); //changed to adminOrSelfToken
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request if invalid data", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: 42,
			})
			.set("authorization", `Bearer ${adminOrSelfToken}`); //changed to adminOrSelfToken
		expect(resp.statusCode).toEqual(400);
	});

	test("works: set new password", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				password: "new-password",
			})
			.set("authorization", `Bearer ${adminOrSelfToken}`); //changed to adminOrSelfToken
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
			},
		});
		const isSuccessful = await User.authenticate("u1", "new-password");
		expect(isSuccessful).toBeTruthy();
	});
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
	test("works for users", async function () {
		const resp = await request(app)
			.delete(`/users/u1`)
			.set("authorization", `Bearer ${adminOrSelfToken}`); //changed to adminOrSelfToken
		expect(resp.body).toEqual({ deleted: "u1" });
	});

	test("unauth for anon", async function () {
		const resp = await request(app).delete(`/users/u1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if user missing", async function () {
		const resp = await request(app)
			.delete(`/users/nope`)
			.set("authorization", `Bearer ${adminOrSelfToken}`); //changed to adminOrSelfToken
		expect(resp.statusCode).toEqual(404);
	});
});

describe("POST /:username/jobs/:id", function () {
	test("works for users", async function () {
		const jobRes = await db.query("SELECT id FROM jobs LIMIT 1");
		const jobId = jobRes.rows[0].id;

		const resp = await request(app)
			.post(`/users/u1/jobs/${jobId}`)
			.set("authorization", `Bearer ${u1Token}`);

		console.log("JOB RES:", jobRes);
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			applied: jobId.toString(),
		});
	});
});
