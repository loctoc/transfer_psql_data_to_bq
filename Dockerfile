# Use an official Node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory
WORKDIR /usr/src/app

# Define the command to run the application
RUN npx -y transfer_psql_data_to_bq --help
