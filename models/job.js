"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
	static async create({ title, salary, equity, company_handle }) {
		const duplicateCheck = await db.query(
			`SELECT id
         FROM jobs
         WHERE title = $1 AND company_handle = $2`,
			[title, company_handle]
		);

		if (duplicateCheck.rows[0])
			throw new BadRequestError(`Duplicate job: ${title}`);

		const result = await db.query(
			`INSERT INTO jobs
         (title, salary, equity, company_handle)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, salary, equity, company_handle`,
			[title, salary, equity, company_handle]
		);
		const job = result.rows[0];
		console.log("job:", job);
		return job;
	}

	static async findAll({ title, minSalary, hasEquity } = {}) {
		let query = `SELECT id,
                            title,
                            salary,
                            equity,
                            company_handle
                     FROM jobs`;
		let whereExpressions = [];
		let queryValues = [];

		// For each possible search term, add to whereExpressions and queryValues so
		// we can generate the right SQL

		if (title !== undefined) {
			queryValues.push(`%${title}%`);
			whereExpressions.push(`title ILIKE $${queryValues.length}`);
		}

		if (minSalary !== undefined) {
			queryValues.push(minSalary);
			whereExpressions.push(`salary >= $${queryValues.length}`);
		}

		if (hasEquity === true) {
			whereExpressions.push(`equity > 0`);
		}

		if (whereExpressions.length > 0) {
			query += " WHERE " + whereExpressions.join(" AND ");
		}

		// Finalize query and return results

		query += " ORDER BY title";
		const jobsRes = await db.query(query, queryValues);
		return jobsRes.rows;
	}
	static async findAllByCompany(handle) {
		const result = await db.query(
			`SELECT id, title, salary, equity
        FROM jobs 
        WHERE company_handle = $1`,
			[handle]
		);

		return result.rows;
	}
	static async get(id) {
		const jobRes = await db.query(
			`SELECT id, title, salary, equity, company_handle
         FROM jobs
         WHERE id = $1`,
			[id]
		);

		const job = jobRes.rows[0];

		if (!job) throw new NotFoundError(`No job: ${id}`);

		return job;
	}

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {});
		const idVarIdx = "$" + (values.length + 1);

		const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, title, salary, equity, company_handle`;
		const result = await db.query(querySql, [...values, id]);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job: ${id}`);

		return job;
	}

	static async remove(id) {
		const result = await db.query(
			`DELETE
         FROM jobs
         WHERE id = $1
         RETURNING id`,
			[id]
		);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job: ${id}`);
	}

	static async applyForJob(username, jobId) {
		// Check if the user exists
		const userRes = await db.query(
			`SELECT username FROM users WHERE username = $1`,
			[username]
		);
		if (userRes.rows.length === 0) {
			throw new NotFoundError(`No such user: ${username}`);
		}

		// Check if the job exists
		const jobRes = await db.query(`SELECT id FROM jobs WHERE id = $1`, [jobId]);
		if (jobRes.rows.length === 0) {
			throw new NotFoundError(`No such job: ${jobId}`);
		}

		const result = await db.query(
			`INSERT INTO applications (username, job_id)
        VALUES ($1, $2)
        RETURNING job_id`,
			[username, jobId]
		);
		return result.rows[0];
	}
}

module.exports = Job;
