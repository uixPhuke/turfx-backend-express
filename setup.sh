#!/bin/bash

mkdir -p src/{config,modules/{auth,user,turf,slot,booking,payment,review,notification,coupon,favorite},middlewares,routes,utils,constants,validators,services,sockets,jobs,docs}
mkdir -p uploads tests

touch .env .env.example .gitignore README.md
touch src/{app.js,server.js}
touch src/config/{db.js,cloudinary.js,firebase.js,razorpay.js,redis.js}

for module in auth user turf slot booking payment review notification coupon favorite
do
  touch src/modules/$module/$module.controller.js
  touch src/modules/$module/$module.service.js
  touch src/modules/$module/$module.routes.js
  touch src/modules/$module/$module.validation.js
  touch src/modules/$module/$module.model.js
done

touch src/middlewares/{auth.middleware.js,role.middleware.js,async.middleware.js,error.middleware.js,upload.middleware.js,validation.middleware.js,notFound.middleware.js}
touch src/routes/index.js
touch src/utils/{ApiError.js,ApiResponse.js,generateToken.js,sendEmail.js,logger.js,pagination.js,uploadToCloudinary.js}
touch src/constants/{roles.js,bookingStatus.js,paymentStatus.js,sports.js}
touch src/validators/common.validation.js
touch src/services/{email.service.js,notification.service.js,redis.service.js}
touch src/sockets/socket.js
touch src/jobs/{bookingReminder.job.js,cleanupExpiredBookings.job.js}
touch src/docs/swagger.js

echo " TurfX backend structure created successfully!"