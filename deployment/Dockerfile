FROM node:16-alpine as builder
# Set directory for all files
WORKDIR /home/node

COPY ./common/package.json ./common/
COPY ./common/ ./common/

COPY ./api/package.json ./api/
COPY ./api/package-lock.json ./api/


WORKDIR /home/node/api

# Install all packages
RUN npm install
# Copy over source code
COPY ./api/ .

RUN npm run prisma:generate
RUN npm run build

# Build final runtime container
FROM node:16-alpine
# Set port to listen
ENV PORT=6000
# Set home dir
WORKDIR /home/node/api
# Copy over built files
COPY --from=builder /home/node/api/dist .

COPY ./api/script ./script
COPY ./api/prisma ./prisma
# Install only required packages
RUN npm install --omit=dev
# Expose port to outside world
EXPOSE 6000
# Start server up
CMD [ "npm", "run" ,"start-docker"]
