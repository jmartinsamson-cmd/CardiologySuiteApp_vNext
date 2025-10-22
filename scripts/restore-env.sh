#!/bin/bash
# Script to restore .env file from backup if it gets deleted

if [ ! -f .env ]; then
    echo "⚠️  .env file is missing!"
    if [ -f .env.backup ]; then
        cp .env.backup .env
        chmod 600 .env
        echo "✅ Restored .env from .env.backup"
    else
        echo "❌ No backup found. Please reconfigure your .env file."
        exit 1
    fi
else
    echo "✅ .env file exists"
fi
