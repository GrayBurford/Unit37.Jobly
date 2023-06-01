"use strict";

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job.js');

const { 
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testJobIds
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

// *********************************** findAll Jobs
describe("Find all jobs", function () {
    test("Find all jobs without filters", async function () {
        const allJobs = await Job.findAll();
        expect(allJobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 100,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1"
                },
                {
                id: testJobIds[1],
                title: "Job2",
                salary: 200,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1"
                },
                {
                id: testJobIds[2],
                title: "Job3",
                salary: 300,
                equity: "0",
                companyHandle: "c1",
                companyName: "C1"
                },
                {
                id: testJobIds[3],
                title: "Job4",
                salary: null,
                equity: null,
                companyHandle: "c1",
                companyName: "C1"
            }
        ])
    })

    test("Find all jobs using title filter", async function () {
        const allJobs = await Job.findAll({ title : 'job1' });
        expect(allJobs).toEqual([{
            id: testJobIds[0],
            title: "Job1",
            salary: 100,
            equity: "0.1",
            companyHandle: "c1",
            companyName: "C1"
        }])
    })

    test("Find all jobs using minSalary filter", async function () {
        const allJobs = await Job.findAll({ minSalary : 250 });
        expect(allJobs).toEqual([{
            id: testJobIds[2],
            title: "Job3",
            salary: 300,
            equity: "0",
            companyHandle: "c1",
            companyName: "C1"
        }])
    })

    test("Find all jobs using hasEquity filter", async function () {
        const allJobs = await Job.findAll({ hasEquity : true });
        expect(allJobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 100,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1"
            },
            {
                id: testJobIds[1],
                title: "Job2",
                salary: 200,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1"
            }
        ])
    })

    test("Find all jobs using multiple filters", async function () {
        const allJobs = await Job.findAll({ minSalary : 101, hasEquity : true });
        expect(allJobs).toEqual([
            {
                id: testJobIds[1],
                title: "Job2",
                salary: 200,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1"
            }
        ])
    })

})

// ************************************** GET
describe("get one job by title", function () {
    test("works", async function () {
      let job = await Job.get("Job3");
      expect(job).toEqual({
        title : "Job3",
        salary : 300,
        equity : "0",
        companyHandle : 'c1'
      });
    });
    
    test("not found if no such job title", async function () {
        try {
          await Job.get("IUSGHDFIUH");
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

});


// ************************************ UPDATE JOB
describe("update one job by title", function () {
    const updateData = {
      salary : 99999
    };
  
    test("works", async function () {
      let job = await Job.update("Job2", updateData);
      expect(job).toEqual({
        id : testJobIds[1],
        title : "Job2",
        salary : 99999,
        equity : "0.2",
        companyHandle : 'c1'
      });  
    });
  
    test("works: set null fields", async function () {
      const updateDataSetNulls = {
        title: "Job2",
        salary: null,
        equity: null,
        company_handle: 'c1'
      };
  
      let job = await Job.update("Job2", updateDataSetNulls);
      expect(job).toEqual({
        id : testJobIds[1],
        title: "Job2",
        salary: null,
        equity: null,
        companyHandle: 'c1'
      });
    });
  
    test("not found error if no such job title", async function () {
      try {
        await Job.update("DOESNOTEXIST", updateData);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  
    test("bad request error from no data", async function () {
      try {
        await Job.update("Job4", {});
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
});
  

// ************************************ REMOVE JOB
describe("remove job", function () {
    test("works", async function () {
      await Job.remove("Job4");
      const res = await db.query(
          "SELECT title FROM jobs WHERE title=$1", ["Job4"]);
      expect(res.rows.length).toEqual(0);
    });
  
    test("not found if no such job title", async function () {
      try {
        await Job.remove("DOESNOTEXIST");
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });