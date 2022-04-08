import RingCentral from '@rc-ex/core';
import {ExtensionTelephonySessionsEvent} from '@rc-ex/core/lib/definitions';
import PubNubExtension from '@rc-ex/pubnub';

const rc = new RingCentral({
  server: process.env.RINGCENTRAL_SERVER_URL,
  clientId: process.env.RINGCENTRAL_CLIENT_ID,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET,
});

const main = async () => {
  await rc.authorize({
    username: process.env.RINGCENTRAL_USERNAME!,
    extension: process.env.RINGCENTRAL_EXTENSION,
    password: process.env.RINGCENTRAL_PASSWORD!,
  });
  const pubNubExtension = new PubNubExtension();
  await rc.installExtension(pubNubExtension);
  pubNubExtension.subscribe(
    ['/restapi/v1.0/account/~/extension/~/telephony/sessions'],
    async _event => {
      const event = _event as ExtensionTelephonySessionsEvent;
      console.log(JSON.stringify(event, null, 2));
      const telephonySessionId = event.body!.telephonySessionId;
      const party = event.body!.parties![0];
      if (party.status?.code === 'Proceeding') {
        const r = await rc
          .restapi()
          .account()
          .telephony()
          .sessions(telephonySessionId)
          .parties(party.id)
          .forward()
          .post({
            phoneNumber: process.env.RINGCENTRAL_FORWARD_TO,
          });
        console.log('before: ' + JSON.stringify(r, null, 2) + ' - after');
      }
    }
  );
};

main();
