from datetime import datetime, timezone
import json
from bson import json_util
from typing import Any, Dict, Optional
from pymongo import MongoClient
import pymongo
import logging
from bson.objectid import ObjectId

logger = logging.getLogger(__name__)

class MongoDBManager:
    def __init__(self, connection_string, database, collection):
        try:
            self._client = MongoClient(connection_string)
            self._db = self._client[database]
            self._collection = self._db[collection]
        except Exception as e:
            logger.error(f"Error during DB initialization: {str(e)}")
            raise

    def upsert_document(
        self,
        query: Dict[str, Any],
        document: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upsert a doc to db document with automatic timestamp handling.
        
        Args:
            query: Query to identify the config
            document: Document data to upsert
            user_id: Optional user ID for tracking who made the change
        
        Returns:
            Dict containing operation result and document ID
        """
        try:
            current_time = datetime.now(timezone.utc)
            
            # Prepare update document
            update_data = document.copy()
            
            # Add audit fields
            update_data['updatedAt'] = current_time
            if user_id:
                update_data['updatedBy'] = user_id

            # Prepare the update operation
            update_operation = {
                '$set': update_data,
                '$setOnInsert': {
                    'createdAt': current_time,
                    'createdBy': user_id if user_id else None
                }
            }

            # Perform upsert
            result = self._collection.update_one(
                query,
                update=update_operation,
                upsert=True
            )

            # Get the updated/inserted document
            updated_doc = self._collection.find_one(query)

            return {
                'success': True,
                'document_id': str(updated_doc['_id']),
                'was_inserted': result.upserted_id is not None,
                'was_modified': result.modified_count > 0,
                'matched_count': result.matched_count,
                'updated_doc': json.loads(json_util.dumps(updated_doc))
            }
        except Exception as e:
            logger.error(f"Error during upsert operation: {str(e)}")
            raise 
    
    def find_document(self, id: str) -> Dict[str, Any]:
        """
        Find a document in the collection.

        Args:
            id: Id to find the document

        Returns:
            Dict containing the found document or None if not found
        """
        try:
            obj_id = ObjectId(id)
            document = self._collection.find_one({"_id": obj_id})
            if document:
                return json.loads(json_util.dumps(document))
            else:
                return None
        except Exception as e:
            logger.error(f"Error during find operation: {str(e)}")
            raise
    
    def find_document_by_doc_type_and_issued_by(self, doc_type: str, issued_by: str = "") -> Dict[str, Any]:
        """
        Find a document in the collection.

        Args:
            doc_type: doc_type to find the document
            issued_by: issued_by to find the document

        Returns:
            Dict containing the found document or None if not found
        """
        try:
            document = self._collection.find_one({"doc_type": doc_type, "doc_issued_by": issued_by})
            if document:
                return json.loads(json_util.dumps(document))
            else:
                return None
        except Exception as e:
            logger.error(f"Error during find operation: {str(e)}")
            raise

    def get_all_documents(self) -> Dict[str, Any]:
        """
        Get all documents in the collection.

        Returns:
            Dict containing all documents
        """
        try:
            documents = list(self._collection.find())
            return json.loads(json_util.dumps(documents))
        except Exception as e:
            logger.error(f"Error during get all documents operation: {str(e)}")
            raise

    def delete_document(self, id: str) -> Dict[str, Any]:
        """
        Delete a document from the collection.

        Args:
            id: Id to find the document

        Returns:
            Dict containing operation result
        """
        try:
            obj_id = ObjectId(id)
            result = self._collection.delete_one({"_id": obj_id})
            return {
                'success': True,
                'deleted_count': result.deleted_count
            }
        except Exception as e:
            logger.error(f"Error during delete operation: {str(e)}")
            raise
    
    def insert_one_document(
        self, 
        document: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Insert a single document with automatic timestamp handling.
        
        Args:
            document: Document to insert
            user_id: Optional user ID for tracking
            
        Returns:
            Dict containing operation result and document ID
        """
        try:
            # Add timestamps and audit fields
            current_time = datetime.now(timezone.utc)
            document['createdAt'] = current_time
            document['updatedAt'] = current_time
            
            if user_id:
                document['createdBy'] = user_id
                document['updatedBy'] = user_id

            # Insert document
            result = self._collection.insert_one(document)

            return {
                'success': True,
                'document_id': str(result.inserted_id),
                'document': json.loads(json_util.dumps(document))
            }
        except pymongo.errors.DuplicateKeyError as e:
            logger.error(f"Duplicate key error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error inserting document: {str(e)}")
            raise
