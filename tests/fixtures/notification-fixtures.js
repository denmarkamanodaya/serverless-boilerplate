const notificationHandlerBody = {
  success: {
    sms: {
      type: 'sms',
      data: {
        otp: '654321',
      },
      recipients: ['639171830603'],
      templateName: 'eg',
      senderName: 'UDBank DEV',
    },
    email: {
      type: 'email',
      data: {
        otp: '654321',
      },
      recipients: ['email@email.com'],
      templateName: 'eg',
      senderName: 'email@email.com',
    },
    emailWithAttachment: {
      type: 'email',
      data: {
        otp: '654321',
      },
      recipients: ['email@email.com'],
      templateName: 'eg',
      senderName: 'email@email.com',
      attachments: [
        {
          s3PresignedUrl: 'http://someurl',
        },
      ],
    },
  },
  fail: {
    validation: {
      type: 'wrong',
      data: {
        otp: '654321',
      },
      recipients: ['639171830603'],
      templateName: 'eg',
      senderName: 'UDBank DEV',
    },
  },
};

const notificationHandlerResponse = {
  sms: {
    messages: [
      {
        messageId: '3811582122604335381045',
        status: {
          description: 'Message sent to next instance',
          groupId: 1,
          groupName: 'PENDING',
          id: 26,
          name: 'PENDING_ACCEPTED',
        },
        to: '639171830603',
      },
    ],
  },
  email: {
    accepted: ['christian.miranda@collabera.com'],
    rejected: [],
    ehlo: ['8BITMIME', 'STARTTLS', 'AUTH PLAIN LOGIN', 'Ok'],
    envelopeTime: 106,
    messageTime: 229,
    messageSize: 314,
    response: '250 Ok 010e01877de09ba4-1c7c42b1-77ea-4454-bcd6-1eb23035affc-000000',
    envelope: {
      from: 'no-reply@uniondigitalbank.io',
      to: ['christian.miranda@collabera.com'],
    },
    messageId: '<7c467b6b-6b8a-9560-ed17-65813aef67cd@uniondigitalbank.io>',
  },
  slack: {
    ok: true,
  },
  slack_error: {
    ok: false,
    error: 'Error',
  },
};

module.exports = { notificationHandlerBody, notificationHandlerResponse };
