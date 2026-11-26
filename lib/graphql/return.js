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

export const RETURN_ORDERS_BY_ORDER_QUERY = `
  query ReturnOrdersByOrder($orderId: String!) {
    returnOrdersByOrder(orderId: $orderId) {
      id
      orderId
      orderItemId
      userId
      reason
      status
      type
      refundAmount
      rejectionReason
      requestedAt
      approvedAt
      completedAt
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

export const REQUEST_RETURN_MUTATION = `
  mutation RequestReturn($input: RequestReturnInput!) {
    requestReturn(input: $input) {
      id
      orderId
      orderItemId
      reason
      status
      type
      refundAmount
      requestedAt
    }
  }
`;

export const REQUEST_REPLACEMENT_MUTATION = `
  mutation RequestReplacement($input: RequestReplacementInput!) {
    requestReplacement(input: $input) {
      id
      orderId
      orderItemId
      reason
      status
      type
      requestedAt
    }
  }
`;

// --- Exchange Flow ---

export const GET_EXCHANGE_QUESTIONS_QUERY = `
  query ExchangeQuestions($categoryCode: String, $productId: String) {
    exchangeQuestions(categoryCode: $categoryCode, productId: $productId) {
      questions {
        id
        categoryCode
        questionKey
        questionText
        displayOrder
        options {
          id
          questionId
          optionKey
          optionLabel
          deductionAmount
          isFatalDisqualifier
          rejectionReason
          displayOrder
        }
      }
      devices {
        id
        categoryCode
        brand
        model
        variant
        baseExchangeValue
      }
    }
  }
`;

export const CALCULATE_EXCHANGE_VALUATION_MUTATION = `
  mutation CalculateExchangeValuation($input: CalculateExchangeValuationInput!) {
    calculateExchangeValuation(input: $input) {
      isEligible
      rejectionReason
      baseExchangeValue
      totalDeductions
      finalDiscount
      deductions {
        questionKey
        optionKey
        deductionAmount
        isFatal
        rejectionReason
      }
    }
  }
`;

export const LOCK_EXCHANGE_QUOTE_MUTATION = `
  mutation LockExchangeQuote($input: LockExchangeQuoteInput!) {
    lockExchangeQuote(input: $input) {
      id
      userId
      productId
      categoryCode
      oldBrand
      oldModel
      oldVariant
      serialOrImei
      baseExchangeValue
      totalDeductions
      finalDiscount
      isDisqualified
      disqualificationReason
      status
      expiresAt
    }
  }
`;

export const GET_EXCHANGE_QUOTE_QUERY = `
  query ExchangeQuote($id: ID!) {
    exchangeQuote(id: $id) {
      id
      productId
      oldBrand
      oldModel
      oldVariant
      serialOrImei
      baseExchangeValue
      totalDeductions
      finalDiscount
      isDisqualified
      disqualificationReason
      status
      expiresAt
    }
  }
`;

export const GET_EXCHANGE_QUERY = `
  query GetExchange($id: ID!) {
    exchange(id: $id) {
      id
      userId
      productId
      exchangeDeviceCatalogId
      oldBrand
      oldModel
      oldVariant
      serialOrImei
      baseExchangeValue
      estimatedDiscount
      finalDiscount
      priceDifference
      status
      quoteId
      answers {
        id
        questionKey
        answerValue
        deductionAmount
      }
      verification {
        id
        verifiedBy
        conditionRating
        isApproved
        screenIntact
        bodyIntact
        functional
        serialMatches
        adjustedDiscount
        notes
        verifiedAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_EXCHANGE_MUTATION = `
  mutation CreateExchange($input: CreateExchangeInput!) {
    createExchange(input: $input) {
      id
      productId
      oldBrand
      oldModel
      oldVariant
      serialOrImei
      baseExchangeValue
      estimatedDiscount
      finalDiscount
      status
      createdAt
    }
  }
`;

export const APPLY_EXCHANGE_TO_ORDER_MUTATION = `
  mutation ApplyExchangeToOrder($input: ApplyExchangeToOrderInput!) {
    applyExchangeToOrder(input: $input) {
      id
      productId
      oldBrand
      oldModel
      estimatedDiscount
      finalDiscount
      priceDifference
      status
      quoteId
    }
  }
`;

export const VERIFY_EXCHANGE_PRODUCT_MUTATION = `
  mutation VerifyExchangeProduct($input: VerifyExchangeProductInput!) {
    verifyExchangeProduct(input: $input) {
      id
      status
      finalDiscount
      priceDifference
      verification {
        id
        conditionRating
        isApproved
        screenIntact
        bodyIntact
        functional
        serialMatches
        adjustedDiscount
        notes
        verifiedAt
      }
    }
  }
`;

export const RESOLVE_EXCHANGE_MISMATCH_MUTATION = `
  mutation ResolveExchangeMismatch($input: ResolveExchangeMismatchInput!) {
    resolveExchangeMismatch(input: $input) {
      id
      status
      finalDiscount
      priceDifference
    }
  }
`;
