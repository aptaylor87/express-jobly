"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 10000,
        equity: "0.001",
        companyHandle: "c1"
    };
  
    test("ok for admin user", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "new",
          salary: 10000,
          equity: "0.001",
          companyHandle: "c1",
        },
      });
    });
  
    test("unauthorized for non admin user", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
    });
  
    test("bad request with missing data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            salary: 10000,
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request with invalid data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            title: 1,
            salary: "good exposure",
            equity: 0.001,
            companyHandle: "c1"
        })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
});


/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
      const resp = await request(app).get("/jobs");
      console.log(resp.body)
      expect(resp.body).toEqual({
        jobs: [
          {
            id: expect.any(Number),
            title: 'J1',
            salary: 1,
            equity: '0.1',
            companyHandle: 'c1'
          },
          {
            id: expect.any(Number),
            title: 'J2',
            salary: 2,
            equity: '0.2',
            companyHandle: 'c1'
          },
          {
            id: expect.any(Number),
            title: 'J3',
            salary: 3,
            equity: null,
            companyHandle: 'c1'
          }
        ]
        });
    });
  
    test("fails: test next() handler", async function () {
      // there's no normal failure event which will cause this route to fail ---
      // thus making it hard to test that the error-handler works with it. This
      // should cause an error, all right :)
      await db.query("DROP TABLE jobs CASCADE");
      const resp = await request(app)
          .get("/jobs")
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(500);
    });
  
    test("filters with valid parameters", async function () {
      const resp = await request(app).get("/jobs/?title=J2&minSalary=2&hasEquity=true");
      expect(resp.body).toEqual({
        jobs:
            [
              
              {
                id: expect.any(Number),
                title: 'J2',
                salary: 2,
                equity: '0.2',
                companyHandle: 'c1'
              },
              
            ],
      }); 
    });
  
    test("bad request with invalid parameter", async function () {
      const resp = await request(app).get("/jobs/?titl=c");
      expect(resp.statusCode).toEqual(400);
    });
  
  
  });
/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
      const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
      expect(resp.body).toEqual({
        job: { 
            id: testJobIds[0],
            title: "J1", 
            salary: 1, 
            equity: "0.1", 
            companyHandle: "c1" },
      });
    });
  
  
    test("not found for no such company", async function () {
      const resp = await request(app).get(`/jobs/0`);
      expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
    test("works for admin users", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0]}`)
          .send({
            title: "J1-new",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        job: { 
            id: testJobIds[0],
            title: "J1-new", 
            salary: 1, 
            equity: "0.1", 
            companyHandle: "c1" },
      });
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0]}`)
          .send({
            title: "J1-new",
          });
      expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth for non admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "J1-new",
            })
            .set("authorization", `Bearer ${u2Token}`);
            expect(resp.statusCode).toEqual(401);
    });
  
    test("not found on no such job", async function () {
      const resp = await request(app)
          .patch(`/jobs/0`)
          .send({
            title: "new nope",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  
    test("bad request on id change attempt", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0]}`)
          .send({
            id: 1,
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });

    test("bad request on companyhandle change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
              companyHandle: 'c2',
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
      });
  
    test("bad request on invalid data", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0]}`)
          .send({
            equity: 0.1,
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admins", async function () {
      const resp = await request(app)
          .delete(`/jobs/${testJobIds[0]}`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({ deleted: `${testJobIds[0]}` });
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .delete(`/jobs/${testJobIds[0]}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth for non admin", async function () {
      const resp = await request(app)
          .delete(`/jobs/${testJobIds[0]}`)
          .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such company", async function () {
      const resp = await request(app)
          .delete(`/jobs/0`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  });
