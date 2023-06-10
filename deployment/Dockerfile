FROM node:16-alpine as builder
# Set directory for all files
WORKDIR /home/node/app
# Copy over package.json files
# COPY ../package*.json .
COPY ./api/package.json .
COPY ./api/package-lock.json .

# Install all packages
RUN npm install
# Copy over source code
COPY ./api/ .

RUN npm run build

# Build final runtime container
FROM node:16-alpine
# Set port to listen
ENV PORT=6000
# Set home dir
WORKDIR /home/node/app
# Copy over built files
COPY --from=builder /home/node/app/dist .

COPY ./api/script ./script
COPY ./api/prisma ./prisma
# Install only required packages
RUN npm install --omit=dev
# Expose port to outside world
EXPOSE 6000
# Start server up
CMD [ "npm", "run" ,"start-docker"]
