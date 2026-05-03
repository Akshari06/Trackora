import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryConstraint
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

/**
 * Firebase Generic Data Access Layer
 * Supports CRUD, Filtering, Pagination, and mandatory error handling.
 */
export const firebaseService = {
  /**
   * Fetch all documents from a collection with advanced options
   */
  async getAll<T>(collectionName: string, options?: { 
    filters?: Record<string, any>;
    limit?: number;
    lastDoc?: any;
    sort?: { column: string; direction?: 'asc' | 'desc' };
  }) {
    try {
      const constraints: QueryConstraint[] = [];
      
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            constraints.push(where(key, '==', value));
          }
        });
      }

      if (options?.sort) {
        constraints.push(orderBy(options.sort.column, options.sort.direction || 'asc'));
      }

      if (options?.lastDoc) {
        constraints.push(startAfter(options.lastDoc));
      }

      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      const q = query(collection(db, collectionName), ...constraints);
      const snapshot = await getDocs(q);
      
      return {
        data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T)),
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, collectionName);
      throw error;
    }
  },

  /**
   * Fetch a single document by ID
   */
  async getById<T>(collectionName: string, id: string) {
    try {
      const docRef = doc(db, collectionName, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        throw new Error(`Document with ID ${id} not found in ${collectionName}`);
      }
      return { id: snapshot.id, ...snapshot.data() } as T;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${id}`);
      throw error;
    }
  },

  /**
   * Create a new document
   */
  async createRecord<T>(collectionName: string, data: any) {
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      return { id: docRef.id, ...data } as T;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionName);
      throw error;
    }
  },

  /**
   * Update a document by ID
   */
  async updateRecord<T>(collectionName: string, id: string, data: any) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data);
      return { id, ...data } as T;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
      throw error;
    }
  },

  /**
   * Delete a document by ID
   */
  async deleteRecord(collectionName: string, id: string) {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
      throw error;
    }
  }
};
