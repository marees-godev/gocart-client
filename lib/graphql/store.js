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
