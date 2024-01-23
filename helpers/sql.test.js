const { sqlForPartialUpdate, sqlForFilteringParams } = require ("./sql");



describe("sqlForPartialUpdate", function() {
    const jsToSQL = {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      };

    test("Works with full update", function() {
        const data = {  firstName: 'Alex', 
                        lastName: 'Taylor', 
                        password: 'secret', 
                        email: 'alex@example.com', 
                        isAdmin: true }

        result = sqlForPartialUpdate(data,jsToSQL)
        expect(result).toEqual({
                setCols: '"first_name"=$1, "last_name"=$2, "password"=$3, "email"=$4, "is_admin"=$5',
                values: [ 'Alex', 'Taylor', 'secret', 'alex@example.com', true ]
              }        
        );              
    });

    test("Works with partial update", function() {
        const data = {  firstName: 'Alex',  
                        email: 'alex@example.com'}

        result = sqlForPartialUpdate(data,jsToSQL)
        expect(result).toEqual({
                setCols: '"first_name"=$1, "email"=$2',
                values: [ 'Alex', 'alex@example.com' ]
              }        
        );              
    });
    
    test("Errors if no data", function() {
        const data = {  }

        expect(() => {
            sqlForPartialUpdate(data,jsToSQL);
          }).toThrow();
    });



});

describe("sqlForFilteringParams", function() {
    const operatorsForFields = {    name: "name ILIKE",
                                    minEmployees: "num_employees >",
                                    maxEmployees: "num_employees <"};

    test("Works with all params(numbers and strings)", function() {
        const data = {
            name: 'and',
            minEmployees: 1,
            maxEmployees: 10
        };
        
        result = sqlForFilteringParams(data, operatorsForFields)
        expect(result).toEqual({
            where: 'name ILIKE $1 AND num_employees > $2 AND num_employees < $3',
            values: [ '%and%', 1, 10 ]
        });
    });

    test("Works with partial params", function() {
        const data = {
            minEmployees: 1,
        };
        
        result = sqlForFilteringParams(data, operatorsForFields)
        expect(result).toEqual({
            where: 'num_employees > $1',
            values: [  1 ]
        });
    });

    test("Works with no data passed in", function() {
        const data = {
            };
        
        result = sqlForFilteringParams(data, operatorsForFields)
        expect(result).toEqual({
            where: '1=1',
            values: [ ]
        });
    });


});
