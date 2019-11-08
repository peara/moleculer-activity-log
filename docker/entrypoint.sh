#!/bin/sh
npx knex migrate:latest --env $NODE_ENV
npm start
