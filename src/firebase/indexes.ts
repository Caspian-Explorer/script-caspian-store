export const CASPIAN_FIRESTORE_INDEXES = {
  indexes: [
    {
      collectionGroup: 'products',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'isActive', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'products',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'isActive', order: 'ASCENDING' },
        { fieldPath: 'category', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'orders',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'orders',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'reviews',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'productId', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'reviews',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'productId', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'rating', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'questions',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'productId', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
  ],
  fieldOverrides: [] as unknown[],
} as const;
