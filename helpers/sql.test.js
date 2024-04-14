const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
	//Checks if the function works correctly when all fields are provided. It checks if the function correctly generates the SQL query string and the values array.
	test("works: all fields", function () {
		const result = sqlForPartialUpdate(
			{ firstName: "Aliya", age: 32 },
			{ firstName: "first_name", age: "age" }
		);
		expect(result).toEqual({
			setCols: '"first_name"=$1, "age"=$2',
			values: ["Aliya", 32],
		});
	});

	//Checks if the function works correctly when only some of the fields are provided. It checks if the function correctly generates the SQL query string and values array.
	test("works: some fields", function () {
		const result = sqlForPartialUpdate(
			{ firstName: "Aliya" },
			{ firstName: "first_name", age: "age" }
		);
		expect(result).toEqual({
			setCols: '"first_name"=$1',
			values: ["Aliya"],
		});
	});

	//Checks if the function throws a BadRequestError when no data is provided.
	test("throws BadRequestError with no data", function () {
		expect(() =>
			sqlForPartialUpdate({}, { firstName: "first_name", age: "age" })
		).toThrow(BadRequestError);
	});
});
