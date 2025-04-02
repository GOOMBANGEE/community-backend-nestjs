## Community API

API for community


## Package List

| Feature                                  | Package                                                                                                                                |
|:-----------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------|
| Authentication                           | @nestjs/passport @nestjs/jwt passport passport-jwt passport-local bcrypt<br/> @types/passport-local @types/passport-jwt @types/bcrypt  |
| Configuration Management and Validation  | @nestjs/config joi                                                                                                                     |
| Database Integration                     | @prisma/client pg<br/> prisma                                                                                                          |
| Email                                    | @nestjs-modules/mailer nodemailer                                                                                                      |
| Error Tracking                           | @sentry/nestjs @sentry/profiling-node                                                                                                  |
| Logging                                  | nest-winston winston <br/> @types/winston                                                                                              |
| Validation                               | class-validator class-transformer                                                                                                      |

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

### Architecture

![architecture](https://github.com/user-attachments/assets/7f5f0949-60e4-436d-9b47-aad41e8d69ac)

### ERD

![erd](https://github.com/user-attachments/assets/adb19ada-08a7-4030-8333-6941f2b5e09f)

### Home

![home](https://github.com/user-attachments/assets/a55217c7-ebc5-4df2-954a-3068fea83190)

### Community

![community](https://github.com/user-attachments/assets/0eb5ba4a-232b-46e5-a3db-c2421cb4a172)

### Post Detail

![postDetail](https://github.com/user-attachments/assets/89402575-c137-4a67-afd3-b26ca8cec351)
