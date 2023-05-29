const db = require('../db');
const { sqlForPartialUpdate } = require('./sql');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');

let user;

beforeEach(async function () {
    const result = await db.query(
        `INSERT INTO users
         (username, password, first_name, last_name, email)
         VALUES
         ($1, $2, $3, $4, $5)
         RETURNING username, first_name, last_name, email`,
         ['testusername', 
         await bcrypt.hash("3489hasdfhg8", BCRYPT_WORK_FACTOR),
         'firsttest',
         'lasttest',
         'email@test.com'
        ]
    );

    user = result.rows[0];
});

afterEach(async function () {
    await db.query('DELETE FROM users');
})

afterAll(async function () {
    await db.end();
})

describe('sqlForPartialUpdate', function () {
    test('Updates user info successfully', function () {
        const userData = {
            firstName : "Gray",
            lastName : 'Burford'    
        };
        const jsToSql = {
            firstName : 'first_name',
            lastName : 'last_name'
        };

        const result = sqlForPartialUpdate(userData, jsToSql);

        expect(result).toEqual({ setCols : '"first_name"=$1, "last_name"=$2', values : ["Gray", "Burford"]});
    });

    test("Throws error if data is missing from request body", function () {
        expect(() => {sqlForPartialUpdate({},{})}).toThrow("No data");
    })

})
