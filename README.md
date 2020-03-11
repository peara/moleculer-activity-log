[![pipeline status](https://gitlab.com/lux-tech/auth-service/badges/dev/pipeline.svg)](https://gitlab.com/lux-tech/auth-service/commits/dev)
[![coverage report](https://gitlab.com/lux-tech/auth-service/badges/dev/coverage.svg)](https://gitlab.com/lux-tech/auth-service/commits/dev)

# base-service

## Build Setup

``` bash
# Install dependencies
npm install

# Start elasticsearch server (wait about 5s to start it, can use `docker logs` or `docker attach` to inspect)
npm run dc-build
npm run up-elastic

# Start kibana (wait about 15s to start it, can use `docker logs` or `docker attach` to inspect)
npm run up-kibana

# Stop elasticsearch server
npm run stop-elastic

# Start developing with REPL
npm run dev

# Start production
npm start

# Run unit tests
npm run test

# Run continuous test mode
npm run ci

# Run ESLint
npm run lint
```

## Run in Docker

**Build Docker image**
```bash
$ docker build -t base-service .
```

**Start container**
```bash
$ docker run -d base-service
```
