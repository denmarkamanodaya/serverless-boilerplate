# UD Serverless Boilerplate API

## Prerequisites

### IAM Permissions
Ensure that the user has ```AWSCloudFormationFullAccess``` permission policies applied to their account

## Development Setup 

#### A. Pre requisites to run locally
1. Postgresql
2. NPM/ Node 14.X
3. Serverless framework version 3
4. jest

#### B. Install all depepdencies locally
1. ```npm install```


#### C. Running migrations
Notes: We're using Sequelize migration
1. Update ```config.json``` located under ```./database/config``` directory. Replace the ```dev``` key values with your environment of choice when you're building/working on the application
2. ```npx sequelize-cli --env development db:migrate``` to run the migratiion. run ```npx sequelize-cli --env dev db:migrate:undo``` to undo the database migration

Do note that if you need to run the migration script on a secure VPC. Please ensure that you are logged in inside a bastion host. The above command will only work for local environments

#### D. Create the Database, and Run the seed data
1. ```npm db:all```

#### E. Run both integration and Unit tests
``` npm test ```

#### How to run locally
1. Create a .env file do note that this will only run in the local environment

``` 
DB_USERNAME=postgres // change this to your local db username
DB_PASSWORD=postgres // change this to your local password
DB_NAME=todo_app // create  a db todo app
DB_HOST=localhost // host address of the DB
DB_DIALECT=postgres
```

2. Add the following values to run this locally
3. npx sequelize-cli --env development db:seed:all
``` sls offline start -s <environment> ```