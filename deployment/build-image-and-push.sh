SCRIPT_DIR=$(dirname -- "$0")

echo "Running In $SCRIPT_DIR"

REGISTRY=treecko.onix.izzatfaris.site
IMAGE_NAME=$REGISTRY/envoi-api:latest

CONTEXT=$SCRIPT_DIR/../

echo "Build Context $CONTEX"

# This is my own private registry
docker login $REGISTRY

docker build --file $SCRIPT_DIR/Dockerfile --tag $IMAGE_NAME $CONTEXT

docker push $IMAGE_NAME

echo "Image Pushed"