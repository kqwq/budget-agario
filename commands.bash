#!bin/bash

# Start minikube
minikube start

# Apply the deployment
kubectl apply -f deployment.yaml

# Apply the service
kubectl apply -f service.yaml

# Get the urls to access the services
minikube service ba-service --url

# Delete everything
minikube kubectl -- delete all --all

# To see logs, minikube kubectl -- logs <pod-name>