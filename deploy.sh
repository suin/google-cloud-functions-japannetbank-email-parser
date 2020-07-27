#!/usr/bin/env bash
set -eux

declare TOPIC_TO_SUBSCRIBE='test%40example.com'
declare TOPIC_TO_PUBLISH='japannetbankNotification'

# Create the topic if not exists
gcloud pubsub topics describe ${TOPIC_TO_SUBSCRIBE} > /dev/null || {
    gcloud pubsub topics create ${TOPIC_TO_SUBSCRIBE}
}
gcloud pubsub topics describe ${TOPIC_TO_PUBLISH} > /dev/null || {
    gcloud pubsub topics create ${TOPIC_TO_PUBLISH}
}

# Deploy the function
gcloud functions deploy publishJapannetbankNotificationOnEmail \
    --runtime nodejs12 \
    --trigger-topic ${TOPIC_TO_SUBSCRIBE} \
    --set-env-vars TOPIC_TO_PUBLISH=${TOPIC_TO_PUBLISH}
