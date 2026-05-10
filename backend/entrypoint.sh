#!/bin/bash

echo "DB Connection --- Establishing . . ."

while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do

    echo "DB Connection -- Failed!"

    sleep 1

    echo "DB Connection -- Retrying . . ."

done

echo "DB Connection --- Successfully Established!"

exec "$@"
