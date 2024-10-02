# Use Linux as base image (with Node.js LTS)
FROM node:20
RUN apt-get update && apt-get install -y libc6
WORKDIR /app

# Copy all files except those in .dockerignore
COPY . .

# Echo the version of Node.js and NPM
RUN 
RUN npm install
EXPOSE 3000:3000
EXPOSE 3001:3001

# Start the app
CMD ["npm", "start"]