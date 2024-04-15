"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureAdmin, async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, companyNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const company = await Company.create(req.body);
		return res.status(201).json({ company });
	} catch (err) {
		return next(err);
	}
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

// This is a route handler for GET requests to the "/companies" endpoint.
// It retrieves a list of companies from the database and sends them back to the client.
// The client can optionally provide filters in the query string to narrow down the results.
router.get("/", async function (req, res, next) {
	try {
		// req.query contains the query string parameters that the client sent with the request.
		// These parameters are passed to the Company.findAll method, which will use them to filter the results.
		const companies = await Company.findAll(req.query); //Add filters to the query string to narrow down the results.

		// The results are then sent back to the client in a JSON format.
		// The JSON object has an array of companies.
		return res.json({ companies });
	} catch (err) {
		// If anything goes wrong while trying to retrieve the companies (for example, if the database is down), the error is passed to the next middleware function in the chain.
		return next(err);
	}
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
	try {
		const company = await Company.get(req.params.handle);
		return res.json({ company });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureAdmin, async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, companyUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const company = await Company.update(req.params.handle, req.body);
		return res.json({ company });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureAdmin, async function (req, res, next) {
	try {
		await Company.remove(req.params.handle);
		return res.json({ deleted: req.params.handle });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
