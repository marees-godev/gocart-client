// GraphQL queries and mutations for Inventory matching GoCart Backend schema

export const GET_STOCK_QUERY = `
  query GetStock($productId: ID!) {
    stock(productId: $productId) {
      productId
      availableQuantity
      reservedQuantity
    }
  }
`;

export const GET_INVENTORY_QUERY = `
  query GetInventory($productId: ID, $variantId: String, $inventoryId: ID, $warehouseId: ID) {
    inventory(productId: $productId, variantId: $variantId, inventoryId: $inventoryId, warehouseId: $warehouseId) {
      inventoryId
      warehouseId
      productId
      variantId
      sku
      availableQuantity
      reservedQuantity
      lowStockThreshold
      updatedAt
      createdAt
    }
  }
`;

export const GET_MY_WAREHOUSES_QUERY = `
  query MyWarehouses($deliveryPartnerId: ID) {
    myWarehouses(deliveryPartnerId: $deliveryPartnerId) {
      id
      deliveryPartnerId
      name
      code
      street
      city
      state
      postalCode
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_WAREHOUSE_QUERY = `
  query GetWarehouse($id: ID!, $deliveryPartnerId: ID) {
    warehouse(id: $id, deliveryPartnerId: $deliveryPartnerId) {
      id
      deliveryPartnerId
      name
      code
      street
      city
      state
      postalCode
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_INVENTORY_MUTATION = `
  mutation CreateInventory($input: CreateInventoryInput!) {
    createInventory(input: $input) {
      inventoryId
      warehouseId
      productId
      variantId
      sku
      availableQuantity
      reservedQuantity
      lowStockThreshold
      updatedAt
      createdAt
    }
  }
`;

export const UPDATE_STOCK_MUTATION = `
  mutation UpdateStock($inventoryId: ID, $productId: ID, $variantId: String, $quantity: Int!) {
    updateStock(inventoryId: $inventoryId, productId: $productId, variantId: $variantId, quantity: $quantity) {
      productId
      availableQuantity
      reservedQuantity
    }
  }
`;

export const RESTOCK_INVENTORY_MUTATION = `
  mutation RestockInventory($input: RestockInventoryInput!) {
    restockInventory(input: $input) {
      inventory {
        inventoryId
        warehouseId
        productId
        variantId
        sku
        availableQuantity
        reservedQuantity
        lowStockThreshold
        updatedAt
        createdAt
      }
      success
    }
  }
`;

export const RESERVE_STOCK_MUTATION = `
  mutation ReserveStock($orderId: ID!, $items: [ReservationItemInput!]!) {
    reserveStock(orderId: $orderId, items: $items) {
      reservationId
      expiresAt
      success
    }
  }
`;

export const RELEASE_STOCK_MUTATION = `
  mutation ReleaseStock($reservationId: ID!) {
    releaseStock(reservationId: $reservationId)
  }
`;

export const CREATE_WAREHOUSE_MUTATION = `
  mutation CreateWarehouse($input: CreateWarehouseInput!) {
    createWarehouse(input: $input) {
      id
      deliveryPartnerId
      name
      code
      street
      city
      state
      postalCode
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_WAREHOUSE_MUTATION = `
  mutation UpdateWarehouse($input: UpdateWarehouseInput!) {
    updateWarehouse(input: $input) {
      id
      deliveryPartnerId
      name
      code
      street
      city
      state
      postalCode
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_WAREHOUSE_MUTATION = `
  mutation DeleteWarehouse($id: ID!, $deliveryPartnerId: ID) {
    deleteWarehouse(id: $id, deliveryPartnerId: $deliveryPartnerId) {
      success
      message
    }
  }
`;
