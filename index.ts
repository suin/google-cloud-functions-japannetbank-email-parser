import { PubSub } from '@google-cloud/pubsub'
import { PubSubFunction } from '@suin/google-cloud-typed-pubsub-function'
import { createFunction } from './createFunction'

const topicToPublish = process.env.TOPIC_TO_PUBLISH

if (typeof topicToPublish !== 'string') {
  throw new Error(`Env TOPIC_TO_PUBLISH is required`)
}

export const publishJapannetbankNotificationOnEmail: PubSubFunction = createFunction(
  {
    topic: new PubSub().topic(topicToPublish),
  },
)
