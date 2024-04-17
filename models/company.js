"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
	/** Create a company (from data), update db, return new company data.
	 *
	 * data should be { handle, name, description, numEmployees, logoUrl }
	 *
	 * Returns { handle, name, description, numEmployees, logoUrl }
	 *
	 * Throws BadRequestError if company already in database.
	 * */

	static async create({ handle, name, description, numEmployees, logoUrl }) {
		const duplicateCheck = await db.query(
			`SELECT handle
           FROM companies
           WHERE handle = $1`,
			[handle]
		);

		if (duplicateCheck.rows[0])
			throw new BadRequestError(`Duplicate company: ${handle}`);

		const result = await db.query(
			`INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
			[handle, name, description, numEmployees, logoUrl]
		);
		const company = result.rows[0];

		return company;
	}

	/** Find all companies.
	 *
	 * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
	 * */

	// This function is responsible for retrieving a list of companies based on the provided filters.
	// It returns an array of company objects.

	static async findAll(filters = {}) {
		// Constructs the initial SQL query to select the necessary columns from the 'companies' table.
		let query = `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies`;

		// Initializes arrays to store the WHERE clause expressions and query values.
		let whereExpressions = [];
		let queryValues = [];

		// Extracts the filter values from the 'filters' object.
		const { name, minEmployees, maxEmployees } = filters;

		// Checks if the minimum number of employees is greater than the maximum number of employees.
		// If so, throw a BadRequestError with an appropriate error message.
		if (minEmployees > maxEmployees) {
			throw new BadRequestError(
				"Min employees cannot be greater than max employees"
			);
		}

		// Checks if the 'name' filter is provided.
		if (name !== undefined) {
			// Adds the query value with wildcard characters to match any part of the company name.
			queryValues.push(`%${name}%`);
			// Adds the corresponding WHERE clause expression to filter by company name in a case-insensitive manner.
			whereExpressions.push(`LOWER(name) LIKE LOWER($${queryValues.length})`);
		}

		// Checks if the 'minEmployees' filter is provided.
		if (minEmployees !== undefined) {
			// Adds the query value to filter companies with a minimum number of employees.
			queryValues.push(minEmployees);
			// Adds the corresponding WHERE clause expression to filter by minimum number of employees.
			whereExpressions.push(`num_employees >= $${queryValues.length}`);
		}

		// Checks if the 'maxEmployees' filter is provided.
		if (maxEmployees !== undefined) {
			// Adds the query value to filter companies with a maximum number of employees.
			queryValues.push(maxEmployees);
			// Adds the corresponding WHERE clause expression to filter by maximum number of employees.
			whereExpressions.push(`num_employees <= $${queryValues.length}`);
		}

		// Checks if there are any WHERE clause expressions.
		if (whereExpressions.length > 0) {
			// Appends the WHERE clause to the query by joining the expressions with 'AND'.
			query += " WHERE " + whereExpressions.join(" AND ");
		}

		// Appends the ORDER BY clause to the query to sort the results by company name.
		query += " ORDER BY name";

		// Executes the SQL query with the provided query values and retrieve the result from the database.
		const companiesRes = await db.query(query, queryValues);

		// Returns the rows of company objects retrieved from the database.
		return companiesRes.rows;
	}

	/** Given a company handle, return data about company.
	 *
	 * Returns { handle, name, description, numEmployees, logoUrl, jobs }
	 *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
	 *
	 * Throws NotFoundError if not found.
	 **/

	static async get(handle) {
		// Query to get the company data
		const companyRes = await db.query(
			`SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
        FROM companies
        WHERE handle = $1`,
			[handle]
		);

		// New query to get the jobs for the company
		// This assumes you have a jobs table with a company_handle column
		const jobsRes = await db.query(
			`SELECT id, 
            title, 
            salary, 
            equity 
        FROM jobs 
        WHERE company_handle = $1`,
			[handle]
		);

		// Get the company data from the first query
		const company = companyRes.rows[0];

		// If there's no company with the given handle, throw an error
		if (!company) throw new NotFoundError(`No company: ${handle}`);

		// Add the jobs to the company object
		// The jobs are an array of job objects, each with id, title, salary, and equity properties
		company.jobs = jobsRes.rows;

		// Return the company object, which now includes the jobs
		return company;
	}
	/** Update company data with `data`.
	 *
	 * This is a "partial update" --- it's fine if data doesn't contain all the
	 * fields; this only changes provided ones.
	 *
	 * Data can include: {name, description, numEmployees, logoUrl}
	 *
	 * Returns {handle, name, description, numEmployees, logoUrl}
	 *
	 * Throws NotFoundError if not found.
	 */

	static async update(handle, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			numEmployees: "num_employees",
			logoUrl: "logo_url",
		});
		const handleVarIdx = "$" + (values.length + 1);

		const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
		const result = await db.query(querySql, [...values, handle]);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	/** Delete given company from database; returns undefined.
	 *
	 * Throws NotFoundError if company not found.
	 **/

	static async remove(handle) {
		const result = await db.query(
			`DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
			[handle]
		);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);
	}
}

module.exports = Company;
