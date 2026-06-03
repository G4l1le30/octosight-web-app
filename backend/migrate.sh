#!/bin/bash
# Run database migrations
cd "$(dirname "$0")"
alembic upgrade head
