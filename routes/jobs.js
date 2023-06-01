"use strict";

// Routes for Jobs
const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError } = require('../expressError');
const { ensureLoggedIn, 
        isAdminAndLoggedIn, 
        isAdminAndLoggedIn 
        } = require('../middleware/auth');

const Job = require('../models/job');

const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobNUpdate.json');

const router = new express.Router();




