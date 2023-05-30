"use strict";

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job.js');

const { 
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


// ************************* CREATE JOB
describe("create new job", function () {
    const newJobData = {
        title : "testtitle",
        salary : 9999,
        equity : "0.5",
        companyHandle : "c1"
    };

    test("works: creates new job from function", async function () {
        const job = await Job.create(newJobData);
        expect(job).toEqual(newJobData);
    })

    test("works: finds new job from database", async function () {
        await Job.create(newJobData);

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS companyHandle
            FROM jobs 
            WHERE title = $1`,
            ['testtitle']
        )
        expect(result.rows[0]).toEqual({
            title : "testtitle",
            salary : 9999,
            equity : "0.5",
            companyhandle : "c1"
        });

    })
})