FROM node:8-stretch
# Working directory for application
WORKDIR /usr/src/app
# Install app dependencies
COPY package*.json ./
RUN npm install
# Binds to port 80
EXPOSE 80
COPY . .