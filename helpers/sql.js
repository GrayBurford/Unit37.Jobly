const { BadRequestError } = require("../expressError");

// dataToUpdate -- object with k/v pairs of data user wants to update. Will come from request body
// jsToSql -- object with k/v pairs of JS keys to SQL columns. i.e.: firstName : first_name
// function returns an object with 2 values:
  // setCols : A string consisting of "first_name=$1, last_name=$2"
  // values : All of the values the user supplied in the request body to update
  // sqlForPartialUpdate(x, y) is used in the User and Company models to update database values using the update method found in each class
// setCols from the returned object is used to build the SQL query, and values is used to update the SQL columns with this new data
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  // keys => ['firstName', 'age']
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

// THIS NEEDS SOME GREAT DOCUMENTATION. Danielle -- DERegan54
// Line 13: The parameter 'dataToUpdate' is an object containing the data to be updated.  
//        The parameter 'jsToSql' is an object containing the key/value pairs corresponding SQL columns and values to be updated
// Line 15: The variable keys takes the dataToUpdate object and extracts the keys into an array, which will be the columns
// Line 16: If the keys array has a length of 0 (meaning it is empty), returns BadRequestError.
// Lines 19 - 21: Else, the keys array is mapped into an object "cols", containing 'colName' (column name) and 'idx' (index in keys array).
// Lines 23 - 27: The function returns an object with keys being 'setCols' (columns to be updated) and 'values' (the values to go into those columns).
//         The 'setCols' keys use the .join() method to join the columns into a string that can be put into the SET portion of the SQL query.
//         The 'values' keys use the object.values() method to put all of the values from the dataToUpdate object into an array that can be used in the SQL query.