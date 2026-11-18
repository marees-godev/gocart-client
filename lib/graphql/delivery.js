export const CALCULATE_SHIPPING_FEE_QUERY = `
  query CalculateShippingFee($input: CalculateShippingFeeInput!) {
    calculateShippingFee(input: $input) {
      shippingFee
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
    }
  }
`;
