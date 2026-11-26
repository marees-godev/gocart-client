// GraphQL queries and mutations for Merchant matching GoCart Backend schema

export const GET_MERCHANT_QUERY = `
  query GetMerchant($id: ID!) {
    merchant(id: $id) {
      id
      businessName
      firstName
      lastName
      businessEmail
      businessPhone
      panCardNumber
      status
      rejectionReason
      createdAt
      updatedAt
      deletedAt
    }
  }
`;

export const GET_MERCHANT_APPEALS_QUERY = `
  query MerchantAppeals($merchantId: ID!) {
    merchantAppeals(merchantId: $merchantId) {
      id
      merchantId
      reason
      status
      adminComment
      reviewedAt
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_MERCHANT_MUTATION = `
  mutation UpdateMerchant($id: ID!, $input: UpdateMerchantInput!) {
    updateMerchant(id: $id, input: $input) {
      id
      businessName
      firstName
      lastName
      businessEmail
      businessPhone
      panCardNumber
      status
      updatedAt
    }
  }
`;

export const DELETE_MERCHANT_MUTATION = `
  mutation DeleteMerchant($id: ID!) {
    deleteMerchant(id: $id)
  }
`;

export const MERCHANT_APPEAL_MUTATION = `
  mutation MerchantAppeal($merchantId: ID!, $reason: String!) {
    merchantAppeal(merchantId: $merchantId, reason: $reason) {
      id
      merchantId
      reason
      status
      createdAt
    }
  }
`;
