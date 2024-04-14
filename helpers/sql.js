const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

// This function is used to generate the SQL query string and values array for a partial update.
//It takes in two arguments:
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	//Gets all the property names (keys) from the dataToUpdate object and stores them in the array keys.
	const keys = Object.keys(dataToUpdate);
	//Checks if the keys array is empty. If it is, it throws a BadRequestError with the message "No data".
	if (keys.length === 0) throw new BadRequestError("No data");

	//Creates a new array called cols by transforming each key in the keys array. For each key, it checks if there's a corresponding property in the jsToSql object. If there is, it uses that property's value; if not, it uses the key itself. It then creates a string that ;ppls ;ole `"keys"=$1`, where "key" is the key name and $1 is a placeholder for the value that will be inserted later. The idx + 1 is used to number the placeholders ($1, $2, $3, etc.).
	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map(
		(colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
	);
	//Creates an object with 2 properties: setCols and values. setCols is a string that contains all the strings from the cols array, sperated by commas. values is an array that contains all the values from the dataToUpdate object..
	return {
		setCols: cols.join(", "),
		values: Object.values(dataToUpdate),
	};
}

module.exports = { sqlForPartialUpdate };
