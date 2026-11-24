// GraphQL queries and mutations for Returns and Reverse Logistics

export const LIST_RETURNS_QUERY = `
  query ListReturns($limit: Int, $offset: Int, $status: String) {
    listReturns(limit: $limit, offset: $offset, status: $status) {
      id
      orderId
      orderItemId
      userId
      reason
      status
      type
      refundAmount
      verification {
        id
        returnId
        verifiedBy
        condition
        isApproved
        proofImages
        notes
        verifiedAt
      }
      requestedAt
      approvedAt
      completedAt
    }
  }
`;

export const GET_RETURN_ORDER_QUERY = `
  query GetReturnOrder($id: ID!) {
    returnOrder(id: $id) {
      id
      orderId
      orderItemId
      userId
      reason
      status
      type
      refundAmount
      verification {
        id
        returnId
        verifiedBy
        condition
        isApproved
        proofImages
        notes
        verifiedAt
      }
      requestedAt
      approvedAt
      completedAt
    }
  }
`;

export const VERIFY_PRODUCT_MUTATION = `
  mutation VerifyProduct($input: VerifyProductInput!) {
    verifyProduct(input: $input) {
      id
      orderId
      status
      type
      refundAmount
      verification {
        id
        condition
        isApproved
        notes
        verifiedAt
      }
    }
  }
`;

export const UPDATE_RETURN_STATUS_MUTATION = `
  mutation UpdateReturnStatus($id: ID!, $status: String!, $rejectionReason: String) {
    updateReturnStatus(id: $id, status: $status, rejectionReason: $rejectionReason) {
      id
      orderId
      status
    }
  }
`;
