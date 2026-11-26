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

export const CREATE_REFUND_MUTATION = `
  mutation CreateRefund($paymentId: ID!, $amount: Float!, $reason: String, $idempotencyKey: String) {
    createRefund(paymentId: $paymentId, amount: $amount, reason: $reason, idempotencyKey: $idempotencyKey) {
      refundId
      status
      amount
      gatewayRefundId
      createdAt
    }
  }
`;

export const CANCEL_PAYMENT_MUTATION = `
  mutation CancelPayment($paymentId: ID, $orderId: String, $reason: String) {
    cancelPayment(paymentId: $paymentId, orderId: $orderId, reason: $reason) {
      id
      orderId
      status
    }
  }
`;
