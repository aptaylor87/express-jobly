const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/**
 * This function helps write SQL for patch routes that offers flexibility to make a
 * full or partial update based on the data provided. 
 * 
 * dataToUpdate will come from the body of the request which is an object with 
 * key/value pairs of the fields to be updated. 
 * 
 * jsToSQL is an object that matches keys of the json format for data fields to 
 * their corresponding names in sql. Only fields that don't match need to be
 * specified here. 
 *  {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        }
 * 
 * The output includes values for setCols, which an be inserted into a SQL statement
 * after the SET keyword. It also includes values, which can be spread into an array
 * after the sql statement when running db.query. 
 * 
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
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


/** This function takes in dynamic query parameters and outputs helper text for
 * sql queries to be built into model methods. operatorsForFields requires 
 * an object that lays out the sql operators and field names that correspond
 * with the filtering parameters that can be passed along in the data.
 * 
 * example = {  name: "name ILIKE",
//              minEmployees: "num_employees >",
//              maxEmployees: "num_employees <"}
 */

function sqlForFilteringParams(dataToFilter, operatorsForFields) {
  const keys = Object.keys(dataToFilter);

  const values = Object.values(dataToFilter).map((value) => 
     isNaN(value) ? `%${value}%` : value);

  const conditions = keys.map((condition, idx) => 
      `${operatorsForFields[condition]} $${idx + 1}`);

  return {
      where: conditions.length ? conditions.join(' AND ') : '1=1',
      values: values
  };

};



module.exports = {  sqlForPartialUpdate,
                    sqlForFilteringParams };
