#!/bin/sh
set -e

eval "$(ssh-agent -s)"
openssl aes-256-cbc -K $encrypted_7b49c23863d8_key -iv $encrypted_7b49c23863d8_iv -in key.enc -out ~/key -d
chmod 600 ~/key
ssh-add ~/key

npm i -g -C . gh-pages
bin/gh-pages -t -d ../docs/ -b gh-pages -r git@github.com:${TRAVIS_REPO_SLUG}.git
