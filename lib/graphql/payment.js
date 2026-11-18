export const PROCESS_PAYMENT_MUTATION = `
  mutation ProcessPayment($input: ProcessPaymentInput!) {
    processPayment(input: $input) {
      id
      orderId
      amount
      currency
      paymentMethod
      status
      transactionReference
      gatewayTransactionId
      failureReason
    }
  }
`;

export const GET_PAYMENT_BY_ORDER_QUERY = `
  query PaymentByOrderId($orderId: String!) {
    paymentByOrderId(orderId: $orderId) {
      id
      orderId
      amount
      currency
      paymentMethod
      status
      transactionReference
      gatewayTransactionId
      failureReason
    }
  }
`;
