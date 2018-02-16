FROM node:8-stretch
# Working directory for application
WORKDIR /usr/src/app
# Install app dependencies
COPY package*.json ./
RUN npm install
# Binds to port 7777
EXPOSE 7777
# Creates a mount point
VOLUME [ "/usr/src/app" ]