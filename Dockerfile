FROM node:20
# Create app directory
WORKDIR /usr/src/app
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev
# Bundle app source
COPY . .

# Set an environment variable to check if we should run `npm update`
ENV DO_UPDATE=true

# Use a custom command to start the application
CMD [ "npm", "run", "bootstrap" ]