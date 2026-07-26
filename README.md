# TurfX Backend

> Production-ready backend for **TurfX**, a football turf
> booking platform.

## Features

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

## Tech Stack

  Layer       Technology
  ----------- --------------------
  Runtime     Node.js
  Framework   Express.js
  Database    MongoDB + Mongoose
  Cache       Redis
  Queue       BullMQ
  Realtime    Socket.IO
  Storage     Cloudinary
  Docs        Swagger
  Testing     Jest + Supertest
  Container   Docker
  CI          GitHub Actions

------------------------------------------------------------------------

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
