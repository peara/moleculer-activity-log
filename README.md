# Activity Log Service for Moleculer

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
$ docker build -t activity-log-service .
```

**Start container**
```bash
$ docker run -d activity-log-service
```
