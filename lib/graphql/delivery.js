// GraphQL queries and mutations for Delivery matching GoCart Backend schema

export const CALCULATE_SHIPPING_FEE_QUERY = `
  query CalculateShippingFee($input: CalculateShippingFeeInput!) {
    calculateShippingFee(input: $input) {
      shippingFee
      platformFee
      currency
      zone
      totalWeightGrams
      calculationModel
      breakdownDetails
    }
  }
`;

export const GET_DELIVERY_BY_ORDER_QUERY = `
  query DeliveryByOrder($orderId: String!) {
    deliveryByOrder(orderId: $orderId) {
      id
      orderId
      trackingNumber
      status
      estimatedDeliveryAt
      deliveredAt
      deliveryPartner
      shippingAddress
      shippingAddressId
      contactNumber
      createdAt
      updatedAt
    }
  }
`;

export const GET_DELIVERY_QUERY = `
  query GetDelivery($id: ID!) {
    delivery(id: $id) {
      id
      orderId
      trackingNumber
      status
      estimatedDeliveryAt
      deliveredAt
      deliveryPartner
      shippingAddress
      shippingAddressId
      contactNumber
      createdAt
      updatedAt
    }
  }
`;

export const GET_DELIVERY_BY_TRACKING_QUERY = `
  query DeliveryByTracking($trackingNumber: String!) {
    deliveryByTracking(trackingNumber: $trackingNumber) {
      id
      orderId
      trackingNumber
      status
      estimatedDeliveryAt
      deliveredAt
      deliveryPartner
      shippingAddress
      shippingAddressId
      contactNumber
      createdAt
      updatedAt
    }
  }
`;

export const GET_DELIVERY_PARTNER_PROFILE_QUERY = `
  query DeliveryPartnerProfile($partnerId: ID) {
    deliveryPartnerProfile(partnerId: $partnerId) {
      id
      partnerId
      companyName
      email
      contactNumber
      gstin
      isGstinVerified
      isActive
      approvalStatus
      rejectionReason
      appealReason
      deactivationReason
      deletionReason
      appealedAt
      deactivatedAt
      deletedAt
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_DELIVERY_MUTATION = `
  mutation CreateDelivery($input: CreateDeliveryInput!) {
    createDelivery(input: $input) {
      id
      orderId
      trackingNumber
      status
      estimatedDeliveryAt
      deliveredAt
      deliveryPartner
      shippingAddress
      shippingAddressId
      contactNumber
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_DELIVERY_STATUS_MUTATION = `
  mutation UpdateDeliveryStatus($id: ID!, $status: DeliveryStatus!, $location: String) {
    updateDeliveryStatus(id: $id, status: $status, location: $location) {
      id
      orderId
      trackingNumber
      status
      estimatedDeliveryAt
      deliveredAt
      deliveryPartner
      shippingAddress
      shippingAddressId
      contactNumber
      createdAt
      updatedAt
    }
  }
`;

export const CANCEL_DELIVERY_MUTATION = `
  mutation CancelDelivery($id: ID!, $reason: String) {
    cancelDelivery(id: $id, reason: $reason) {
      id
      orderId
      status
    }
  }
`;

export const UPDATE_DELIVERY_PARTNER_PROFILE_MUTATION = `
  mutation UpdateDeliveryPartnerProfile($input: UpdateDeliveryPartnerProfileInput!) {
    updateDeliveryPartnerProfile(input: $input) {
      id
      partnerId
      companyName
      email
      contactNumber
      gstin
      isGstinVerified
      isActive
      approvalStatus
      updatedAt
    }
  }
`;

export const ACTIVATE_DELIVERY_PARTNER_MUTATION = `
  mutation ActivateDeliveryPartner {
    activateDeliveryPartner {
      success
      message
      status
    }
  }
`;

export const DEACTIVATE_DELIVERY_PARTNER_MUTATION = `
  mutation DeactivateDeliveryPartner($reason: String!) {
    deactivateDeliveryPartner(reason: $reason) {
      success
      message
      status
    }
  }
`;

export const APPEAL_DELIVERY_PARTNER_MUTATION = `
  mutation AppealDeliveryPartnerRejection($reason: String!) {
    appealDeliveryPartnerRejection(reason: $reason) {
      id
      partnerId
      approvalStatus
      appealReason
      appealedAt
    }
  }
`;

export const REACTIVATE_DELIVERY_PARTNER_MUTATION = `
  mutation ReactivateDeliveryPartner {
    reactivateDeliveryPartner {
      success
      message
      status
    }
  }
`;

export const DELETE_DELIVERY_PARTNER_MUTATION = `
  mutation DeleteDeliveryPartner($reason: String) {
    deleteDeliveryPartner(reason: $reason) {
      success
      message
      status
    }
  }
`;
