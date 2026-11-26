export const CREATE_STORE_MUTATION = `
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(input: $input) {
      id
      name
      slug
      approvalStatus
      businessEmail
      description
      logoUrl
      address
    }
  }
`;

export const SUBMIT_STORE_MUTATION = `
  mutation SubmitStore($id: ID!) {
    submitStore(id: $id) {
      id
      name
      slug
      approvalStatus
      businessEmail
      businessPhone
      description
      logoUrl
      address
      isVacationMode
      isPublished
      rejectionReason
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_STORE_MUTATION = `
  mutation UpdateStore($input: UpdateStoreInput!) {
    updateStore(input: $input) {
      id
      name
      slug
      businessEmail
      businessPhone
      description
      logoUrl
      address
      isVacationMode
      approvalStatus
      isPublished
    }
  }
`;

export const PUBLISH_STORE_MUTATION = `
  mutation PublishStore($id: ID!) {
    publishStore(id: $id) {
      id
      name
      isPublished
      approvalStatus
    }
  }
`;

export const UNPUBLISH_STORE_MUTATION = `
  mutation UnpublishStore($id: ID!) {
    unpublishStore(id: $id) {
      id
      name
      isPublished
      approvalStatus
    }
  }
`;

export const GET_USER_STORE_QUERY = `
  query GetMyStore {
    myStore {
      id
      merchantId
      name
      slug
      approvalStatus
      rejectionReason
      businessEmail
      businessPhone
      description
      logoUrl
      address
      isVacationMode
      isPublished
      kycStatus
      gstin
      avgStoreRating
      createdAt
      updatedAt
    }
  }
`;

export const APPROVE_STORE_MUTATION = `
  mutation ApproveStore($id: ID!) {
    approveStore(id: $id) {
      id
      name
      approvalStatus
    }
  }
`;

export const REJECT_STORE_MUTATION = `
  mutation RejectStore($id: ID!, $reason: String!) {
    rejectStore(id: $id, reason: $reason) {
      id
      name
      approvalStatus
      rejectionReason
    }
  }
`;

export const GET_ALL_STORES_QUERY = `
  query GetAllStores($limit: Int, $offset: Int) {
    stores(limit: $limit, offset: $offset) {
      stores {
        id
        name
        slug
        merchantId
        businessEmail
        businessPhone
        description
        logoUrl
        address
        approvalStatus
        createdAt
      }
      total
    }
  }
`;

export const GET_MERCHANT_STORES_QUERY = `
  query GetMerchantStores($merchantId: ID, $limit: Int, $offset: Int) {
    stores(merchantId: $merchantId, limit: $limit, offset: $offset) {
      stores {
        id
        name
        slug
        merchantId
        businessEmail
        businessPhone
        description
        logoUrl
        address
        approvalStatus
        isPublished
        isVacationMode
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const GENERATE_STORE_UPLOAD_URL_MUTATION = `
  mutation GenerateStoreUploadUrl($input: GenerateStoreUploadUrlInput!) {
    generateStoreUploadUrl(input: $input) {
      uploadUrl
      publicUrl
      key
      expiresInSeconds
    }
  }
`;

export const SUBMIT_KYC_MUTATION = `
  mutation SubmitKYC($input: SubmitKYCInput!) {
    submitKYC(input: $input) {
      id
      kycStatus
      gstin
      bankAccount {
        accountHolderName
        bankName
        accountNumber
        ifscCode
        gstin
      }
    }
  }
`;

export const GET_STORE_APPEALS_QUERY = `
  query StoreAppeals($storeId: ID!) {
    storeAppeals(storeId: $storeId) {
      id
      storeId
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

export const APPEAL_STORE_MUTATION = `
  mutation AppealStore($id: ID!, $reason: String!) {
    appealStore(id: $id, reason: $reason) {
      id
      storeId
      reason
      status
      createdAt
    }
  }
`;

export const CLOSE_STORE_MUTATION = `
  mutation CloseStore($id: ID!, $reason: String) {
    closeStore(id: $id, reason: $reason) {
      id
      approvalStatus
      isPublished
    }
  }
`;

