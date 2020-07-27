import { EmailData } from '@suin/email-data'
import { EventData } from '@suin/event-data'
import { PubSubFunction } from '@suin/google-cloud-typed-pubsub-function'
import { createFunction, Dependencies, Logger } from './createFunction'

describe('createFunction', () => {
  const mutedLogger: Logger = {
    info: () => {},
    error: () => {},
  }
  let publishedEvents: any[] = []
  const topicStub: Dependencies['topic'] = {
    name: 'dummy-topic-name',
    publish: async (data: Buffer) => {
      publishedEvents.push(JSON.parse(data.toString()))
      return ''
    },
  }
  const publishJapannetbankNotificationOnEmail = createFunction({
    topic: topicStub,
    logger: mutedLogger,
  })
  const dummyContext = {
    timestamp: '',
    eventId: '',
    eventType: '',
  }

  beforeEach(() => {
    publishedEvents = []
  })

  it('publishes notification', async () => {
    const email: EmailData = {
      to: [],
      cc: [],
      replyTo: [],
      subject: '【Ｖｉｓａデビット】ご利用代金お引き落としのお知らせ',
      from: [],
      bodyText: `いつもジャパンネット銀行をご利用いただきありがとうございます。

JNB Visaデビットのご利用代金を普通預金口座よりお引き落としいたしました。
お引落日時：2001/02/03 04:05:06
お引落金額：2,760円
加盟店名：ＡＭＡＺＯＮ　ＣＯ　ＪＰ
取引明細番号：1A165002

[...略...]`,
    }
    await publishJapannetbankNotificationOnEmail(
      createValidEvent({
        correlationId: 'dummy',
        data: email,
      }),
      dummyContext,
    )
    expect(publishedEvents).toEqual([
      {
        correlationId: 'dummy',
        data: {
          email,
          notification: {
            type: 'visaWithdrawn',
            withdrawnOn: '2001-02-03T04:05:06+09:00',
            amount: 2760,
            shop: 'ＡＭＡＺＯＮ　ＣＯ　ＪＰ',
            number: '1A165002',
          },
        },
      },
    ])
  })

  it('publishes without notification', async () => {
    const email: EmailData = {
      to: [],
      cc: [],
      replyTo: [],
      from: [],
    }
    await publishJapannetbankNotificationOnEmail(
      createValidEvent({
        correlationId: 'dummy',
        data: email,
      }),
      dummyContext,
    )
    expect(publishedEvents).toEqual([
      {
        correlationId: 'dummy',
        data: { email },
      },
    ])
  })
})

const createValidEvent = (
  data: EventData<EmailData>,
): Parameters<PubSubFunction>[0] => {
  return {
    data: Buffer.from(JSON.stringify(data)).toString('base64'),
    attributes: null,
  }
}
