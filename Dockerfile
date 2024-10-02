# Use Linux as base image (with Node.js LTS)
FROM node:lts
WORKDIR /app

# Copy all files except those in .dockerignore
COPY . .

# Install dependencies
RUN npm install
EXPOSE 3000:3000
EXPOSE 3001:3001

# Start the app
CMD ["npm", "start"]