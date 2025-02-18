## Community API

API for community


## Package List

| Feature                                 | Installation Command                                                                                                                                       |
| :-------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validation                              | npm i class-validator class-transformer                                                                                                                    |
| Database Integration                    | npm i @prisma/client pg<br/> npm install -D prisma                                                                                                         |
| Logging                                 | npm i nest-winston winston <br/> npm install -D @types/winston                                                                                             |
| Error Tracking                          | npm i @sentry/nestjs @sentry/profiling-node                                                                                                                |
| Hot Reload (Webpack)                    | npm install -D webpack-node-externals run-script-webpack-plugin webpack                                                                                    |
| Configuration Management and Validation | npm i @nestjs/config joi                                                                                                                                   |
| Authentication                          | npm i @nestjs/passport @nestjs/jwt passport passport-jwt passport-local bcrypt<br/> npm install -D @types/passport-local @types/passport-jwt @types/bcrypt |
| Email                                   | npm i @nestjs-modules/mailer nodemailer                                                                                                                    |

## Project setup

```bash
git clone https://github.com/GOOMBANGEE/community-backend-nestjs

cd community-backend-nestjs
cp sample.env .env

npm install
```

## Compile and run the project

```bash
# development
npm run start

# watch mode
npm run start:dev
```

## Deploy project


```bash
# db migrate
cd community-backend-nestjs
npm install
npx prisma migrate dev --name init

# create docker image
docker build -t localhost:5000/community:latest .

# set deploy environment
mkdir -p ./postgresql/data 
cp sample.env ./env/community.env
docker-compose up -d # need postgresql port forwarding


```
