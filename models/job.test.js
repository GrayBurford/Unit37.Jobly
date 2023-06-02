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
        expect(job).toEqual({
            id : expect.any(Number), 
            ...newJobData
        });
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
describe("get one job by id", function () {
    test("works", async function () {
      let job = await Job.get(testJobIds[0]);
      expect(job).toEqual({
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "0.1",
        company: {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      });
    });
    
    test("not found if no such job", async function () {
        try {
          await Job.get(9999);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });

});


// ************************************ UPDATE JOB
describe("update one job by id", function () {
    const updateData = {
      salary : 9999
    };
  
    test("works", async function () {
      let job = await Job.update(testJobIds[2], updateData);
      expect(job).toEqual({
        id: testJobIds[2],
        title: "Job3",
        salary: 9999,
        equity: "0",
        companyHandle : "c1",
      });  
    });
  
    test("works: set null fields", async function () {
      const nullData = {
        title: "Job1",
        salary: null,
        equity: null,
        company_handle: 'c1'
      };
  
      let job = await Job.update(testJobIds[0], nullData);
      
      expect(job).toEqual({
        id: testJobIds[0],
        title: "Job1",
        salary: null,
        equity: null,
        companyHandle: "c1"
      });
    });
  
    test("not found error if no such job id", async function () {
      try {
        await Job.update(0, updateData);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  
    test("bad request error from no data", async function () {
      try {
        await Job.update(testJobIds[0], {});
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
});
  

// ************************************ REMOVE JOB
describe("remove job", function () {
    test("works", async function () {
      await Job.remove(testJobIds[2]);
      const res = await db.query(
          "SELECT id FROM jobs WHERE id=$1", [testJobIds[2]]);
      expect(res.rows.length).toEqual(0);
    });
  
    test("not found if no such job id", async function () {
      try {
        await Job.remove(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });