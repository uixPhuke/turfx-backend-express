# PLAYZA Backend

> PLAYZA backend under active development. The existing MongoDB API is retained while PostgreSQL/Prisma features are prepared and verified.

## Current development

See [implementation decisions](docs/PLAYZA_IMPLEMENTATION.md) and [Prisma schema](prisma/schema.prisma). Run `npm run test:security`, `npm run db:validate`, `npm run typecheck`, and `npm run lint`. PostgreSQL integration tests require an isolated test instance via `PLAYZA_TEST_DATABASE_URL`. Run the separate PostgreSQL API with `npm run start:postgres`; its [API contract](docs/POSTGRES_API.md) documents implemented endpoints and limits. No production cutover has been performed.

## Legacy feature inventory

-   JWT Authentication (Access & Refresh Tokens)
-   User, Owner & Admin roles
-   Turf & Slot Management
-   Booking & Payment (Razorpay ready)
-   Wallet & Coupons
-   Reviews & Notifications
-   Redis Caching
-   BullMQ Background Jobs
-   Socket.IO Real-time Events
-   Cloudinary Image Uploads
-   Swagger API Documentation
-   Jest Test Suite
-   Docker Support
-   GitHub Actions CI
-   Security (Helmet, CORS, Rate Limiting, HPP, XSS, Mongo Sanitize)

------------------------------------------------------------------------

## 🛠️ Tech Stack

| | |
|---|---|
| **Runtime** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) |
| **Framework** | ![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) |
| **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white) |
| **Cache** | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white) |
| **Queue** | ![BullMQ](https://img.shields.io/badge/BullMQ-FF6B35?style=for-the-badge) |
| **Realtime** | ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white) |
| **Storage** | ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white) |
| **Documentation** | ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black) |
| **Testing** | ![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white) |
| **Container** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) |
| **CI/CD** | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white) |

## Project Structure

``` text
src/
├── config/
├── constants/
├── docs/
├── jobs/
├── middlewares/
├── modules/
│   ├── auth/
│   ├── user/
│   ├── admin/
│   ├── turf/
│   ├── slot/
│   ├── booking/
│   ├── payment/
│   ├── wallet/
│   ├── coupon/
│   ├── review/
│   └── notification/
├── queues/
├── routes/
├── services/
├── sockets/
├── utils/
├── validators/
├── workers/
├── app.js
└── server.js
```

------------------------------------------------------------------------

## Installation

``` bash
git clone <repository-url>
cd turfx
npm install
```

------------------------------------------------------------------------

## Environment Variables

Create a `.env` file.

``` env
PORT=8000
NODE_ENV=development

MONGODB_URI=
REDIS_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

------------------------------------------------------------------------

## Run

Development

``` bash
npm run dev
```

Production

``` bash
npm start
```

------------------------------------------------------------------------

## Docker

``` bash
docker compose up --build
```

------------------------------------------------------------------------

## API

Base URL

``` text
http://localhost:8000/api/v1
```

Swagger

``` text
http://localhost:8000/api/docs
```

Health

``` text
http://localhost:8000/api/v1/health
```

------------------------------------------------------------------------

## Modules

-   Authentication
-   Users
-   Admin
-   Turf
-   Slot
-   Booking
-   Payment
-   Wallet
-   Coupon
-   Review
-   Notification

------------------------------------------------------------------------

## Background Jobs

-   Email Queue
-   Booking Queue
-   Notification Queue
-   Payment Queue

------------------------------------------------------------------------

## Security

-   Helmet
-   CORS
-   Rate Limiting
-   Compression
-   MongoDB Injection Protection
-   XSS Protection
-   HPP Protection
-   Request Logging

------------------------------------------------------------------------

## CI/CD

-   GitHub Actions
-   Docker
-   Docker Compose

------------------------------------------------------------------------

## Testing

``` bash
npm test
```

------------------------------------------------------------------------

## Scripts

``` bash
npm run dev
npm start
npm test
npm run lint
npm run format
```

------------------------------------------------------------------------

## Roadmap

-   Deploy Backend
-   React Native App
-   Admin Dashboard
-   Monitoring
-   Analytics

------------------------------------------------------------------------

## License

MIT

------------------------------------------------------------------------

## Author

**Ruhon Borah**

-   Full Stack Developer
-   MERN Stack
-   Node.js • Express • MongoDB • Redis • React Native
