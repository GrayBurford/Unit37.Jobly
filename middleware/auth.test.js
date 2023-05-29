"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  isAdminAndLoggedIn,
  isAdminOrCorrectUser
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
     //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });
  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", is_admin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });
  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});


describe("isAdminAndLoggedIn", function () {
  test("Checks that user is Admin", function () {
    const req = {};
    const res = {
      locals : {
        user : {
          username : "TESTUSERNAME",
          isAdmin : true
        }
      }
    }
    const next = function (error) {
      expect(error).toBeFalsy();
    }

    isAdminAndLoggedIn(req, res, next);
  })
  test("Throws error if user is not admin", function () {
    expect.assertions(1);
    const req = {};
    const res = {
      locals : {
        user : {
          username : "TESTUSERNAME",
          isAdmin : false
        }
      }
    }
    const next = function (error) {
      expect(error).toBeTruthy();
    }
    isAdminAndLoggedIn(req, res, next);
  })
})

describe("isAdminOrCorrectUser", function () {
  test("Checks that user is admin and with incorrect username", function () {
    expect.assertions(1);
    const req = { params : { username : "testusername" } };
    const res = { locals : { user : { username : "admin", isAdmin : true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };

    isAdminOrCorrectUser(req, res, next);
  })

  test("Checks correct user is logged in and is not admin", function () {
    expect.assertions(1);
    const req = { params : { username : "sameusername" } };
    const res = { locals : { user : { username : "sameusername", isAdmin : false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };

    isAdminOrCorrectUser(req, res, next);
  })

  test("Throw error if username is incorrect and is not admin", function () {
    expect.assertions(1);
    const req = { params : { username : "testusername" } };
    const res = { locals : { user : { username : "WRONGUSERNAME", isAdmin : false } } };
    const next = function (err) {
      expect(err).toBeTruthy();
    };

    isAdminOrCorrectUser(req, res, next);
  })

  test("Throw error is request from anon user", function () {
    expect.assertions(1);
    const req = { params : { username : "ANONUSER" } };
    const res = { locals : { } };
    const next = function (err) {
      expect(err).toBeTruthy();
    };

    isAdminOrCorrectUser(req, res, next);
  })
})