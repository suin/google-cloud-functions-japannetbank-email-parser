# @suin/google-cloud-functions-japannetbank-email-parser

この Google Cloud Function はジャパンネット銀行の通知メールをパースし、通知種別ごとにオブジェクトを作り、それを Google Cloud Pub/Sub に publish する半部品です。

ジャパンネット銀行の通知メールのパースは、[@suin/japannetbank-email-parser](https://github.com/suin/japannetbank-email-parser) が行います。対応している通知についてはそちらを御覧ください。

## アーキテクチャ

![](https://i.imgur.com/JFh9GNv.jpg)

所定のトピックにメールデータを入れると、`publishJapannetbankNotificationOnEmail`関数がそれを処理し、「ジャパンネット銀行通知オブジェクト」を別のトピックに publish します。

## セットアップ

### Email Hook のシステムを構築する

このパッケージは半部品なので、メールを受信する機構が含まれていません。GCP の Pub/Sub のトピックに積まれたメールデータを処理するだけです。したがって、メールを受信してそのトピックにメールデータを publish するシステムは別途用意する必要があります。

Email Hook を実現するパッケージとしては、以下の半部品パッケージを組み合わせてください:

- [suin/google-cloud-functions-sendgrid-inbound-parse: This package is a backend for SendGrid Inbound Parse. It runs on Google Cloud Platform Functions. It receives the form data from SendGrid and publishes an EmailData event to GCP Pub/Sub.](https://github.com/suin/google-cloud-functions-sendgrid-inbound-parse)
- [suin/google-cloud-functions-email-router: A Google Cloud Function that routes EmailData](https://github.com/suin/google-cloud-functions-email-router)

なお、メール受信用トピックのデータは[EventData](https://github.com/suin/event-data/blob/master/index.ts#L3) < [EmailData](https://github.com/suin/email-data/blob/master/index.ts#L25) >のオブジェトを `JSON.stringify` したものであれば良いので、上記の半部品パッケージを使わなくても構いません。お好みで。

### ジャパンネット銀行の my m@ail を有効化する

ジャパンネット銀行の[メール通知サービス my m@il](https://www.japannetbank.co.jp/service/account/mail/index.html) を有効化し、メール通知を受け取れるようにします。

### GCP にデプロイする

デプロイするには[./deploy.sh](./deploy.sh)を実行してください。トピック名のカスタマイズが必要な場合は、このファイルを変更してください。

```bash
./deploy.sh
```

## 動作テスト

このパッケージ単体での動作確認は、次の手順で行うことができます。

```bash
# デバッグ用のサブスクリプションを作る
gcloud pubsub subscriptions create --topic 'japannetbankNotification' testDrive

# メールデータを入れる
gcloud pubsub topics publish 'test%40example.com' --message '{"correlationId":"dummy","data":{"to":[],"cc":[],"replyTo":[],"subject":"【Ｖｉｓａデビット】ご利用代金お引き落としのお知らせ","from":[],"bodyText":"いつもジャパンネット銀行をご利用いただきありがとうございます。\n\nJNB Visaデビットのご利用代金を普通預金口座よりお引き落としいたしました。\nお引落日時：2001/02/03 04:05:06\nお引落金額：2,760円\n加盟店名：ＡＭＡＺＯＮ　ＣＯ　ＪＰ\n取引明細番号：1A165002\n\n[...略...]"}}'

# 関数によってpublishされたデータを確認する
gcloud pubsub subscriptions pull testDrive \
    --format="flattened(ackId,message.messageId,message.publishTime,message.attributes,message.data.decode(base64).encode(utf-8))" \
    --limit=10 \
    --auto-ack

# 掃除
gcloud pubsub subscriptions delete testDrive
```
