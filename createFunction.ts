import type { Topic } from '@google-cloud/pubsub'
import { EmailData, parseEmailData } from '@suin/email-data'
import { newEventData, parseEventData } from '@suin/event-data'
import type { PubSubFunction } from '@suin/google-cloud-typed-pubsub-function'
import {
  JapannetbankNotification,
  parseJapannetbankNotification,
} from '@suin/japannetbank-email-parser'

export const createFunction = ({
  topic,
  logger = defaultLogger,
}: Dependencies): PubSubFunction => async event => {
  const incomingEvent = parseEventData(
    JSON.parse(Buffer.from(event.data, 'base64').toString('utf-8')),
  )
  const emailData = parseEmailData(incomingEvent.data)

  const notification = parseJapannetbankNotification({
    subject: emailData.subject ?? '',
    text: emailData.bodyText ?? '',
  })
  const outgoingEvent = newEventData<Data>({
    correlationId: incomingEvent.correlationId,
    data: {
      email: emailData,
      notification,
    },
  })
  await topic.publish(Buffer.from(JSON.stringify(outgoingEvent), 'utf8'), {
    type: notification?.type ?? 'unknown',
  })
  logger.info(
    `Published event ${outgoingEvent.correlationId} to ${topic.name}`,
    {
      event: outgoingEvent,
    },
  )
}

const defaultLogger: Logger = {
  error(message: string, meta?: unknown): void {
    console.error(JSON.stringify({ message, meta }))
  },
  info(message: string, meta?: unknown): void {
    console.info(JSON.stringify({ message, meta }))
  },
}

export type Dependencies = {
  readonly topic: Pick<Topic, 'publish' | 'name'>
  readonly logger?: Logger
}

export type Logger = Pick<Console, 'info' | 'error'>

export type Data = {
  readonly email: EmailData
  readonly notification?: JapannetbankNotification
}
