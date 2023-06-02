"use strict";

const request = require('supertest');
const db = require('../db');
const app = require('../app');
const { BadRequestError } = require('../expressError');

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token, 
    adminToken
} = require("./_testCommon");
const { testJobIds } = require('./_testCommon');
const { isAdminAndLoggedIn } = require('../middleware/auth');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


// ************************************ POST /jobs
describe("POST /jobs", function () {
    let newJob = {
        title : "newJob",
        salary : 12345,
        equity : "0.1",
        companyHandle : 'c1'
    }

    test("Non-admins cannot post new job", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
        expect(resp.body.error.message).toBe("Unauthorized");
    });

    test("Admins can post new job", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);

        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({ job : {
            id : expect.any(Number),
            title : "newJob",
            salary : 12345,
            equity : "0.1",
            companyHandle : 'c1'
        } });
    })

    test("bad request with missing required data", async function () {
        newJob.title = null;

        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    })

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title : "newJob",
                salary : 12345,
                equity : "0.1",
                companyHandle : 55,
                wrongentry : "wrong"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
})


// ******************************************* GET /jobs
describe('GET /jobs', function () {
    test("works for non-admin", async function () {
        const resp = await request(app).get('/jobs');
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ jobs : [
            {
                id : expect.any(Number),
                title : "testjob1",
                salary : 111,
                equity : "0.1",
                companyHandle : "c1",
                companyName : "C1"
            },
            {
                id : expect.any(Number),
                title : "testjob2",
                salary : 222,
                equity : "0.2",
                companyHandle : "c1",
                companyName : "C1"
            },
            {
                id : expect.any(Number),
                title : "testjob3",
                salary : 333,
                equity : "0.3",
                companyHandle : "c1",
                companyName : "C1"
            }
        ] })
    })

    test("works for admins", async function () {
        const resp = await request(app).get('/jobs')
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ jobs : [
            {
                id : expect.any(Number),
                title : "testjob1",
                salary : 111,
                equity : "0.1",
                companyHandle : "c1",
                companyName : "C1"
            },
            {
                id : expect.any(Number),
                title : "testjob2",
                salary : 222,
                equity : "0.2",
                companyHandle : "c1",
                companyName : "C1"
            },
            {
                id : expect.any(Number),
                title : "testjob3",
                salary : 333,
                equity : "0.3",
                companyHandle : "c1",
                companyName : "C1"
            }
        ] })
    })

    test("Works with hasEquity filter", async function () {
        const resp = await request(app).get('/jobs')
            .query({ hasEquity : true });
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ jobs : [
            {
                id : expect.any(Number),
                title : "testjob1",
                salary : 111,
                equity : "0.1",
                companyHandle : "c1",
                companyName : "C1"
            },
            {
                id : expect.any(Number),
                title : "testjob2",
                salary : 222,
                equity : "0.2",
                companyHandle : "c1",
                companyName : "C1"
            },
            {
                id : expect.any(Number),
                title : "testjob3",
                salary : 333,
                equity : "0.3",
                companyHandle : "c1",
                companyName : "C1"
            }
        ] })
    })

    test("Works with 2 filters", async function () {
        const resp = await request(app).get('/jobs')
            .query({ title : "3", minSalary : 100 });
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ jobs : [
            {
                id : expect.any(Number),
                title : "testjob3",
                salary : 333,
                equity : "0.3",
                companyHandle : "c1",
                companyName : "C1"
            }
        ] })
    })

    test("Fails with invalid query string filter", async function () {
        const resp = await request(app).get('/jobs')
            .query({ nope : "nope" });
        expect(resp.statusCode).toEqual(400);
        
    })
})


// ***************************************** GET /jobs/:id
describe("GET /jobs/:id", function () {
    test("works for ANON users", async function () {
        const resp = await request(app)
            .get(`/jobs/${testJobIds[0]}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            job: {
                id: testJobIds[0],
                title: "testjob1",
                salary: 111,
                equity: "0.1",
                company: {
                    handle: "c1",
                    name: "C1",
                    description: "Desc1",
                    numEmployees: 1, 
                    logoUrl: "http://c1.img",                
                }            
            }
        });
    });

    test("throws NotFoundError if job is does not exist", async function () {
        const resp = await request(app)
            .get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});


// ***************************************** PATCH /jobs/:id
describe("PATCH /jobs/:id", function () {
    test("Works for Admin users", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({ equity : "0.3", salary : 1111 })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            job : {
                id: testJobIds[0],
                title: "testjob1",
                salary: 1111,
                equity: "0.3",
                companyHandle: "c1"            
            }
        });
    })

    test("Fails for non-admin users", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({ equity : "0.3", salary : 1111 })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    })

    test("Throws NotFoundError if job id does not exist", async function () {
        const resp = await request(app)
            .patch(`/jobs/293457283`)
            .send({ equity : "0.3", salary : 1111 })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    })

    test("Throws error when trying to update unauthorized data", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({ id : 42 })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(403);
    })

    test("Throws error when trying to update invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({ salary : "words" })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    })
})


// ************************************ DELETE /jobs/:id
describe("DELETE /jobs/:id", function () {
    test("Works for admin users", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[2]}`)
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(202);
        expect(resp.body).toEqual({ deleted : testJobIds[2] })
    })

    test("Fails for non-admin users", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[2]}`)
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toEqual(401);
    })

    test("Throw NotFoundError when job id is not found", async function () {
        const resp = await request(app)
            .delete(`/jobs/45634`)
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(404);
    })
})