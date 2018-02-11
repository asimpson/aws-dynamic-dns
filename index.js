'use strict';

const aws = require('aws-sdk');
const shell = require('child_process').spawnSync;

const route = new aws.Route53();

const getId = () => {
  return new Promise((resolve, reject) => {
    route.listHostedZones({}, (err, data) => {
      if (!err) {
        const id = data.HostedZones
          .filter(x => x.Name === process.env.ZONE)
          .map(x => x.Id)[0]
          .split('/')[2];
        resolve(id);
      } else {
        reject(err);
      }
    });
  });
};

const checkCurrentRecord = id => {
  return new Promise((resolve, reject) => {
    route.listResourceRecordSets({ HostedZoneId: id }, (err, data) => {
      if (!err) {
        data.ResourceRecordSets
          .filter(x => x.Name === process.env.DOMAIN)
          .forEach(x => resolve(x.ResourceRecords));
      } else {
        reject(err);
      }
    });
  });
};

const getIp = () => {
  const ip = shell('dig', [
    '+short',
    'myip.opendns.com',
    '@resolver1.opendns.com',
  ]);
  return ip.stdout.toString();
};

const updateDNS = (id, ip) => {
  const params = {
    ChangeBatch: {
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: process.env.DOMAIN,
            Type: 'A',
            ResourceRecords: [
              {
                Value: ip,
              },
            ],
            TTL: 300,
          },
        },
      ],
    },
    HostedZoneId: id,
  };
  route.changeResourceRecordSets(params, (err, data) => {
    if (!err) {
      console.log(data);
    } else {
      console.error(err);
    }
  });
};

getId().then(id => {
  const digIp = getIp();

  checkCurrentRecord(id).then(recordedIp => {
    if (recordedIp[0].Value.trim() !== digIp.trim()) {
      updateDNS(id, digIp);
    }
  });
});
