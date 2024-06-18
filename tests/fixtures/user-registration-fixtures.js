module.exports.userRegistrationParameters = {
  handler: {
    mobileVerification: {
      countryCode: '63',
      mobileNumber: '9994443333',
    },

    otpVerification: {
      countryCode: '63',
      mobileNumber: '9994443333',
      otp: '123456',
      token: 'ABC1234',
    },

    userCreationConflict: {
      countryCode: '63',
      mobileNumber: '9994443333',
      username: '639994443333',
      password: 'ABC123',
      oneTimeToken: 'token',
    },

    userCreationSuccess: {
      countryCode: '63',
      mobileNumber: '9100000139',
      username: '639100000139',
      password: 'ABC123',
      oneTimeToken: 'token',
    },
    user: {
      membershipId: '7c1e6d8b-92be-4f49-b02d-4530a0d658aa',
      username: '639994443333',
      userDid: '0895908c9fb064ef542bea49e811e66faf9f0cb7',
      createdBy: '7c1e6d8b-92be-4f49-b02d-4530a0d658aa',
      updatedBy: '7c1e6d8b-92be-4f49-b02d-4530a0d658aa',
      salt: 'GuJlPxYl9cZXXAc90hudng==',
      password:
        'ab362d0f69c51f75bd310c402488898053931d98a5e12412c515e217d91616c1b15294606ae392f67ffae8b344aee9fe78b69d5aeb4fe9436fb3e22d25186250',
      isActive: true,
    }
  },
};
