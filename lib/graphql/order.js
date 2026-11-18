export const CREATE_ORDER_MUTATION = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      userId
      storeId
      status
      orderStatus
      paymentStatus
      parentOrderId
      orderNumber
      totalAmount
      shippingAddress
      items {
        id
        productId
        productName
        quantity
        unitPrice
        totalPrice
      }
      createdAt
    }
  }
`;

export const CHECKOUT_MUTATION = `
  mutation Checkout($input: CreateOrderInput!) {
    checkout(input: $input) {
      id
      userId
      storeId
      status
      orderStatus
      paymentStatus
      parentOrderId
      orderNumber
      totalAmount
      shippingAddress
      items {
        id
        productId
        productName
        quantity
        unitPrice
        totalPrice
      }
      createdAt
    }
  }
`;

export const GET_ORDER_QUERY = `
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      userId
      storeId
      status
      orderStatus
      paymentStatus
      parentOrderId
      orderNumber
      subtotal
      taxAmount
      shippingFee
      discountAmount
      totalAmount
      currency
      shippingAddress
      shippingAddressId
      billingAddressId
      items {
        id
        productId
        productName
        quantity
        unitPrice
        totalPrice
      }
      createdAt
      updatedAt
    }
  }
`;

export const LIST_MY_ORDERS_QUERY = `
  query ListMyOrders($limit: Int, $offset: Int) {
    listMyOrders(limit: $limit, offset: $offset) {
      orders {
        id
        userId
        storeId
        status
        orderStatus
        paymentStatus
        parentOrderId
        orderNumber
        totalAmount
        currency
        shippingAddress
        items {
          id
          productId
          productName
          quantity
          unitPrice
          totalPrice
        }
        createdAt
      }
      total
    }
  }
`;
