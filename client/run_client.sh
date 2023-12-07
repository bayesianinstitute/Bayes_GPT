#!/bin/bash

# Function to run the Node.js server
run_server() {
    npm run preview
}

# Run the Node.js Client function
run_server

# Ignore Ctrl+C signal
trap '' INT

# Loop to monitor and restart the server
while true; do
    # Sleep for a few seconds before checking again
    sleep 2

    # Check if the server process is running
    ps aux | grep "npm run preview" | grep -v "grep"
    
    # $? stores the exit status of the last command (grep)
    if [ $? -ne 0 ]; then
        echo "Client crashed. Restarting..."
        run_server
    fi
done
