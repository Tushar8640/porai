#!/bin/sh
set -e

PRISMA="node /app/node_modules/prisma/build/index.js"
TSX="node /app/node_modules/tsx/dist/cli.mjs"

echo "Running database migrations..."
$PRISMA migrate deploy

echo "Seeding database (skipped if already done)..."
$TSX /app/prisma/seed.ts || echo "Seed skipped (data may already exist)"

echo "Starting application..."
exec node server.js
