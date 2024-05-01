#!/bin/bash

echo "Setting up dynamic user $(id -u):$(id -g)"

docker buildx build -f Dockerfile_dynamic_user \
    --build-arg DOCKER_IMAGE_NAME=electronuserland/builder:wine \
    --build-arg USER_ID=$(id -u) \
    --build-arg GROUP_ID=$(id -g) \
    --tag local_electron_builder \
    . && \

docker run --rm -ti \
    --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
    --env ELECTRON_CACHE="/home/dynamic_user/.cache/electron" \
    --env ELECTRON_BUILDER_CACHE="/home/dynamic_user/.cache/electron-builder" \
    -v ${PWD}:/project \
    -v ${PWD##*/}-node-modules:/project/node_modules \
    -v ${npm_config_cache}:${npm_config_cache} \
    -v ~/.cache/electron:/home/dynamic_user/.cache/electron \
    -v ~/.cache/electron-builder:/home/dynamic_user/.cache/electron-builder \
    local_electron_builder /bin/bash -c "$@"
