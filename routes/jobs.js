"use strict";

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job } */
// This is a route handler for POST requests to the "/jobs" endpoint.
router.post("/", ensureAdmin, async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, jobNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const job = await Job.create(req.body);
		return res.status(201).json({ job });
	} catch (err) {
		return next(err);
	}
});

/** GET /  =>  { jobs: [ { id, title, salary, equity, company_handle }, ...] } */
// This is a route handler for GET requests to the "/jobs" endpoint.
router.get("/", async function (req, res, next) {
	const q = req.query;
	// convert minSalary to a number
	if (q.minSalary !== undefined) q.minSalary = +q.minSalary;
	// convert hasEquity to a boolean
	q.hasEquity = q.hasEquity === "true";

	try {
		const jobs = await Job.findAll(q);
		return res.json({ jobs });
	} catch (err) {
		return next(err);
	}
});

/** GET /[id]  =>  { job: { id, title, salary, equity, company_handle } } */
// This is a route handler for GET requests to the "/jobs/:id" endpoint.

router.get("/:id", async function (req, res, next) {
	try {
		const job = await Job.get(req.params.id);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});


/** PATCH /[id] { fld1, fld2, ... } => { job: { id, title, salary, equity, company_handle } } */
// This is a route handler for PATCH requests to the "/jobs/:id" endpoint.

router.patch("/:id", ensureAdmin, async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, jobUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const job = await Job.update(req.params.id, req.body);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[id]  =>  { deleted: id } */
// This is a route handler for DELETE requests to the "/jobs/:id" endpoint.
router.delete("/:id", ensureAdmin, async function (req, res, next) {
	try {
		await Job.remove(req.params.id);
		return res.json({ deleted: req.params.id });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
