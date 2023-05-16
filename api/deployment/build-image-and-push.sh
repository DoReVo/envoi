SCRIPT_DIR=$(dirname -- "$0")

REGISTRY=treecko.onix.izzatfaris.site
IMAGE_NAME=$REGISTRY/envoi-api:latest

# This is my own private registry
docker login $REGISTRY

docker build --file $SCRIPT_DIR/Dockerfile --tag $IMAGE_NAME $SCRIPT_DIR/../

docker push $IMAGE_NAME