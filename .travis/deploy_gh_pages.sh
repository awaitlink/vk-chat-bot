#!/bin/sh
set -e

eval "$(ssh-agent -s)"
openssl aes-256-cbc -K $encrypted_7b49c23863d8_key -iv $encrypted_7b49c23863d8_iv -in key.enc -out ~/travis/key -d
chmod 600 ~/travis/key
ssh-add ~/travis/key

yarn add -D gh-pages
./node_modules/.bin/gh-pages -d docs/ -b gh-pages -r git@github.com:${TRAVIS_REPO_SLUG}.git
