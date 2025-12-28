/**
 * Prisma Client - Mock implementation for development
 * Replace with actual Prisma client when database is configured
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock data stores
const mockCategories: any[] = [];
const mockProjects: any[] = [];

// Generic model methods factory
function createMockModel(dataStore: any[], modelName: string) {
  let idCounter = 1;
  return {
    findMany: async (options?: any) => {
      let result = [...dataStore];
      if (options?.where) {
        result = result.filter((item) => {
          return Object.entries(options.where).every(([key, value]) => {
            if (value === null) return item[key] === null;
            if (typeof value === 'object' && value !== null && 'in' in value) {
              return (value as { in: any[] }).in.includes(item[key]);
            }
            return item[key] === value;
          });
        });
      }
      if (options?.orderBy) {
        const orderEntry = Object.entries(options.orderBy)[0];
        if (orderEntry) {
          const [field, direction] = orderEntry as [string, string];
          result.sort((a, b) => {
            if (direction === 'asc') return a[field] > b[field] ? 1 : -1;
            return a[field] < b[field] ? 1 : -1;
          });
        }
      }
      return result;
    },
    findUnique: async (options: any) => {
      return dataStore.find((item) => item.id === options.where.id) || null;
    },
    findFirst: async (options?: any) => {
      if (!options?.where) return dataStore[0] || null;
      return dataStore.find((item) => {
        return Object.entries(options.where).every(([key, value]) => {
          if (value === null) return item[key] === null;
          return item[key] === value;
        });
      }) || null;
    },
    create: async (options: any) => {
      const id = `${modelName}-${idCounter++}`;
      const newItem = { id, ...options.data, createdAt: new Date(), updatedAt: new Date() };
      dataStore.push(newItem);
      return newItem;
    },
    update: async (options: any) => {
      const index = dataStore.findIndex((item) => item.id === options.where.id);
      if (index === -1) throw new Error('Not found');
      dataStore[index] = { ...dataStore[index], ...options.data, updatedAt: new Date() };
      return dataStore[index];
    },
    delete: async (options: any) => {
      const index = dataStore.findIndex((item) => item.id === options.where.id);
      if (index === -1) throw new Error('Not found');
      const [deleted] = dataStore.splice(index, 1);
      return deleted;
    },
    deleteMany: async (options?: any) => {
      let count = 0;
      if (options?.where) {
        for (let i = dataStore.length - 1; i >= 0; i--) {
          const matches = Object.entries(options.where).every(([key, value]) => dataStore[i][key] === value);
          if (matches) {
            dataStore.splice(i, 1);
            count++;
          }
        }
      } else {
        count = dataStore.length;
        dataStore.length = 0;
      }
      return { count };
    },
    updateMany: async (options: any) => {
      let count = 0;
      dataStore.forEach((item, index) => {
        const matches = Object.entries(options.where).every(([key, value]) => item[key] === value);
        if (matches) {
          dataStore[index] = { ...item, ...options.data, updatedAt: new Date() };
          count++;
        }
      });
      return { count };
    },
    aggregate: async (options?: any) => {
      let result = [...dataStore];
      if (options?.where) {
        result = result.filter((item) => {
          return Object.entries(options.where).every(([key, value]) => {
            if (value === null) return item[key] === null;
            return item[key] === value;
          });
        });
      }
      const aggregation: any = {};
      if (options?._max) {
        aggregation._max = {};
        Object.keys(options._max).forEach((field) => {
          const values = result.map((item) => item[field]).filter((v) => v != null);
          aggregation._max[field] = values.length > 0 ? Math.max(...values) : null;
        });
      }
      if (options?._count) {
        aggregation._count = result.length;
      }
      return aggregation;
    },
    count: async (options?: any) => {
      if (!options?.where) return dataStore.length;
      return dataStore.filter((item) => {
        return Object.entries(options.where).every(([key, value]) => item[key] === value);
      }).length;
    },
  };
}

// Mock model type
type MockModel = ReturnType<typeof createMockModel>;

// Prisma client type
interface MockPrismaClient {
  category: MockModel;
  project: MockModel;
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $transaction: <T>(operations: Promise<T>[] | ((tx: MockPrismaClient) => Promise<T>)[]) => Promise<T[]>;
}

// Mock Prisma client
export const prisma: MockPrismaClient = {
  category: createMockModel(mockCategories, 'category'),
  project: createMockModel(mockProjects, 'project'),
  $connect: async () => {
    console.log('[Prisma Mock] Connection established');
  },
  $disconnect: async () => {
    console.log('[Prisma Mock] Connection closed');
  },
  $transaction: async <T>(operations: Promise<T>[] | ((tx: MockPrismaClient) => Promise<T>)[]) => {
    const results: T[] = [];
    for (const op of operations) {
      if (typeof op === 'function') {
        results.push(await op(prisma));
      } else {
        results.push(await op);
      }
    }
    return results;
  },
};

export default prisma;
