docker build -t pharmbio/pipelinegui:latest .
docker push pharmbio/pipelinegui:latest

read -p "Do you want to push with \"stable\" tag also? [y|n]" -n 1 -r < /dev/tty
echo
if ! grep -qE "^[Yy]$" <<< "$REPLY"; then
    exit 1
fi

docker build -t pharmbio/pipelinegui:stable .
docker push pharmbio/pipelinegui:stable
