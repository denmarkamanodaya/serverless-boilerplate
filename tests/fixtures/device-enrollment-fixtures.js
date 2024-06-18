const deviceEnrollmentParameters = {
  missingHeaderParameter: {
    'x-ud-device-make-model': '1234',
  },

  missingEnrollmentToken: {
    'z-device-enrollment-token': 'ABC1234',
    'z-ud-device-id': '1234',
  },

  missingOtp: {
    'fake-otp': 'ABC123',
    'fake-otpId': '1234',
  },

  missingInAppOtp: {
    'fake-inAppOtp': 'ABC123',
  },

  missingUnenrollmentDeviceId: {
    'fake-deviceId': 'ABC123',
  },

  missingDeviceId: {
    'z-ud-device-id': '1234',
  },
  missingParameter: {},
  missingMakeModel: {
    'x-ud-device-id': 'device-x',
  },
  missingDeviceModel: {
    'x-ud-device-make-model': 'device-000',
  },
  expectParametersDeviceEnrollment: {
    'x-ud-device-id': 'device-x',
    'x-ud-device-make-model': 'device-000',
  },
  missingDeviceEnrollmentDeviceId: {
    'x-device-enrollment-token': 'this is token',
  },
  missingDeviceEnrollmentToken: {
    'x-ud-device-id': 'device-x',
  },
  expectParametersDeviceEnrollmentToken: {
    'x-ud-device-id': 'device-x',
    'x-device-enrollment-token': 'this is token',
  },
  expectParameterDeviceId: {
    'x-ud-device-id': 'device-x',
  },

  handler: {
    token:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6ImpXVCJ9.eyJpYXQiOjE2OTMyODU1NTUsImV4cCI6MTY5MzI4NzM1NSwidXNlcm5hbWUiOiI2Mzk5OTQ0NDMzMzMiLCJtb2JpbGVOdW1iZXIiOiI2Mzk5OTQ0NDMzMzMiLCJkZXZpY2VJZCI6ImI3YjNjNmQzYTFlMTU2YmE1MmQwODRjOWY5MzVmYjQ5ZDQzODEzNjQwMWQ0YTNhNTgxZGU0MDI1YjdmOGMwYWMtMTY5Mjk0NDcwMzQyMCIsImF1dGhVc2VySWQiOiIzNDAzZDE2Yi03ODliLTQ2MTEtYTFhZS1iM2M0ODU1ZjUzZmEiLCJlbWFpbEFkZHJlc3MiOiJhdGhlbmEuYWd1aWxhckBjb2xsYWJlcmFkaWdpdGFsLmNvbSIsImN1c3RvbWVySWQiOjg2MCwiY29uc3VtZXJJZCI6ODYwLCJjaWQiOiJjN2Y3ZDQxMi1mYjcwLTRmODItYjM3MC03MjIwYTZhOTQ5YWIiLCJpZCI6IjM0MDNkMTZiLTc4OWItNDYxMS1hMWFlLWIzYzQ4NTVmNTNmYSJ9.rArHCyTcqw2KshditL-82neCdaIRwWbfEh2IzXFra3KOFRvl46ZhOtQCclURu3MOFYlTsnXtV3XSmkHzvVNp7fPgnDkjhojVSlTvgzJ75vl1PAE_a7ML8psjkHuE5d4ypQuDupX6LOWSjUvN8h6zey1sBbWErlVTM40rdoyz_T0wV4LsqbWO5IKXVsXpexzw7_pgbjD4ox6fTkVaIZgMYM9mJ61oZdqCCjiSC26Fm45XubGPKSq57pmXY3TwWfEfMvGOd1h_Wf4ecCajExBeFVtBiFcyvI6sK9E9e7I7cn4M3FrF-EwalIsa2v0tznx7Ma7UW4c5MAsZf7jwLIAOY0RV3zE9KtrbxlLRa4X_RVUbItmcs1mZbPNYGddiMjQayIEJSo_byllgxoLtKaN4dHl7Du2Vg_j9CWQKg2xUoOlPLAY4AFm9Kn8VaRjdVbccYXO6y2zLJAbvy96NIzX5zDH5A_Oy5DRtXrHbN2B4AKUmgVIDItwaje7tOFW2ZTpEPgUWTGcoWssa1ychSWHJBAzawXsmHE-Y_KDlzzI5_XmsrZkvAZcJs-5TtSiHetbt0uVlfNr15bY2Po_8pO51UDv0Pa9h-iWhLZlgluaF4Bc0DGDvrCDITAEA3wNB6TuzsSOnoRthnYMhFiJpRcIahlwEvPO-ODMViwKgg7w6ekY',
    body: {
      otp: {
        otp: '123456',
        otpId: '123456-123456-123456',
      },
    },
    headers: {
      'x-device-enrollment-token':
        'eyJhbGciOiJSUzI1NiIsInR5cCI6ImpXVCJ9.eyJpYXQiOjE2OTMyODU1NTUsImV4cCI6MTY5MzI4NzM1NSwidXNlcm5hbWUiOiI2Mzk5OTQ0NDMzMzMiLCJtb2JpbGVOdW1iZXIiOiI2Mzk5OTQ0NDMzMzMiLCJkZXZpY2VJZCI6ImI3YjNjNmQzYTFlMTU2YmE1MmQwODRjOWY5MzVmYjQ5ZDQzODEzNjQwMWQ0YTNhNTgxZGU0MDI1YjdmOGMwYWMtMTY5Mjk0NDcwMzQyMCIsImF1dGhVc2VySWQiOiIzNDAzZDE2Yi03ODliLTQ2MTEtYTFhZS1iM2M0ODU1ZjUzZmEiLCJlbWFpbEFkZHJlc3MiOiJhdGhlbmEuYWd1aWxhckBjb2xsYWJlcmFkaWdpdGFsLmNvbSIsImN1c3RvbWVySWQiOjg2MCwiY29uc3VtZXJJZCI6ODYwLCJjaWQiOiJjN2Y3ZDQxMi1mYjcwLTRmODItYjM3MC03MjIwYTZhOTQ5YWIiLCJpZCI6IjM0MDNkMTZiLTc4OWItNDYxMS1hMWFlLWIzYzQ4NTVmNTNmYSJ9.rArHCyTcqw2KshditL-82neCdaIRwWbfEh2IzXFra3KOFRvl46ZhOtQCclURu3MOFYlTsnXtV3XSmkHzvVNp7fPgnDkjhojVSlTvgzJ75vl1PAE_a7ML8psjkHuE5d4ypQuDupX6LOWSjUvN8h6zey1sBbWErlVTM40rdoyz_T0wV4LsqbWO5IKXVsXpexzw7_pgbjD4ox6fTkVaIZgMYM9mJ61oZdqCCjiSC26Fm45XubGPKSq57pmXY3TwWfEfMvGOd1h_Wf4ecCajExBeFVtBiFcyvI6sK9E9e7I7cn4M3FrF-EwalIsa2v0tznx7Ma7UW4c5MAsZf7jwLIAOY0RV3zE9KtrbxlLRa4X_RVUbItmcs1mZbPNYGddiMjQayIEJSo_byllgxoLtKaN4dHl7Du2Vg_j9CWQKg2xUoOlPLAY4AFm9Kn8VaRjdVbccYXO6y2zLJAbvy96NIzX5zDH5A_Oy5DRtXrHbN2B4AKUmgVIDItwaje7tOFW2ZTpEPgUWTGcoWssa1ychSWHJBAzawXsmHE-Y_KDlzzI5_XmsrZkvAZcJs-5TtSiHetbt0uVlfNr15bY2Po_8pO51UDv0Pa9h-iWhLZlgluaF4Bc0DGDvrCDITAEA3wNB6TuzsSOnoRthnYMhFiJpRcIahlwEvPO-ODMViwKgg7w6ekY',
      authorization:
        'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6ImpXVCJ9.eyJpYXQiOjE2OTMyODU1NTUsImV4cCI6MTY5MzI4NzM1NSwidXNlcm5hbWUiOiI2Mzk5OTQ0NDMzMzMiLCJtb2JpbGVOdW1iZXIiOiI2Mzk5OTQ0NDMzMzMiLCJkZXZpY2VJZCI6ImI3YjNjNmQzYTFlMTU2YmE1MmQwODRjOWY5MzVmYjQ5ZDQzODEzNjQwMWQ0YTNhNTgxZGU0MDI1YjdmOGMwYWMtMTY5Mjk0NDcwMzQyMCIsImF1dGhVc2VySWQiOiIzNDAzZDE2Yi03ODliLTQ2MTEtYTFhZS1iM2M0ODU1ZjUzZmEiLCJlbWFpbEFkZHJlc3MiOiJhdGhlbmEuYWd1aWxhckBjb2xsYWJlcmFkaWdpdGFsLmNvbSIsImN1c3RvbWVySWQiOjg2MCwiY29uc3VtZXJJZCI6ODYwLCJjaWQiOiJjN2Y3ZDQxMi1mYjcwLTRmODItYjM3MC03MjIwYTZhOTQ5YWIiLCJpZCI6IjM0MDNkMTZiLTc4OWItNDYxMS1hMWFlLWIzYzQ4NTVmNTNmYSJ9.rArHCyTcqw2KshditL-82neCdaIRwWbfEh2IzXFra3KOFRvl46ZhOtQCclURu3MOFYlTsnXtV3XSmkHzvVNp7fPgnDkjhojVSlTvgzJ75vl1PAE_a7ML8psjkHuE5d4ypQuDupX6LOWSjUvN8h6zey1sBbWErlVTM40rdoyz_T0wV4LsqbWO5IKXVsXpexzw7_pgbjD4ox6fTkVaIZgMYM9mJ61oZdqCCjiSC26Fm45XubGPKSq57pmXY3TwWfEfMvGOd1h_Wf4ecCajExBeFVtBiFcyvI6sK9E9e7I7cn4M3FrF-EwalIsa2v0tznx7Ma7UW4c5MAsZf7jwLIAOY0RV3zE9KtrbxlLRa4X_RVUbItmcs1mZbPNYGddiMjQayIEJSo_byllgxoLtKaN4dHl7Du2Vg_j9CWQKg2xUoOlPLAY4AFm9Kn8VaRjdVbccYXO6y2zLJAbvy96NIzX5zDH5A_Oy5DRtXrHbN2B4AKUmgVIDItwaje7tOFW2ZTpEPgUWTGcoWssa1ychSWHJBAzawXsmHE-Y_KDlzzI5_XmsrZkvAZcJs-5TtSiHetbt0uVlfNr15bY2Po_8pO51UDv0Pa9h-iWhLZlgluaF4Bc0DGDvrCDITAEA3wNB6TuzsSOnoRthnYMhFiJpRcIahlwEvPO-ODMViwKgg7w6ekY',
    },
    decodedToken: {
      mobileNumber: '639994443333',
      deviceId: 'b7b3c6d3a1e156ba52d084c9f935fb49d438136401d4a3a581de4025b7f8c0ac-1692944703420',
      authUserId: '3403d16b-789b-4611-a1ae-b3c4855f53fa',
      emailAddress: 'athena.aguilar@collaberadigital.com',
      customerId: 860,
    },
    user: {
      id: '5342f987-9a38-49ce-b668-4900af9d323d',
      username: '639994443333',
      membershipId: 860,
      isActive: 1,
    },
    device: {
      id: '00274454-0ab9-43a7-b20c-c8a03c5fa1e1',
      mobileInstanceId: '56bdbeb7d526b52e09f1ec324abe1500a2dbb066eb1eb8c9699789e1960c6a08',
      userId: '5342f987-9a38-49ce-b668-4900af9d323d',
      makeModel: '0',
      trusted: false,
      inAppOtpEnabled: false,
      accessCode: null,
      createdBy: '753',
      updatedBy: null,
      createdAt: Date('2023-07-28T11:16:36.000Z'),
      updatedAt: Date('2023-07-28T11:16:36.000Z'),
    },
  },
};

module.exports = { deviceEnrollmentParameters };
