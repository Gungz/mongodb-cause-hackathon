from flask import Flask, request, jsonify, g
import os
import boto3
from langchain_community.document_loaders import AmazonTextractPDFLoader
import json
import base64
from helper import *
from MongoDBManager import *

app = Flask(__name__)
app.config.from_prefixed_env()

UPLOAD_FOLDER = ''
BUCKET_NAME = ''
REGION_NAME = 'us-east-1'
MONGODB_CONNECTION_STRING = ''
MONGODB_DATABASE = ''
MONGODB_COLLECTION = ''
MONGODB_CREDENTIAL_SECRET = ''
BEDROCK_MODEL_ID = "us.anthropic.claude-3-5-haiku-20241022-v1:0"

if not app.config.get('UPLOAD_FOLDER'):
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
if not app.config.get('BUCKET_NAME'):
    app.config['BUCKET_NAME'] = BUCKET_NAME
if not app.config.get('REGION_NAME'):
    app.config['REGION_NAME'] = REGION_NAME
if not app.config.get('MONGODB_CONNECTION_STRING'):
    app.config['MONGODB_CONNECTION_STRING'] = MONGODB_CONNECTION_STRING
if not app.config.get('MONGODB_DATABASE'):
    app.config['MONGODB_DATABASE'] = MONGODB_DATABASE
if not app.config.get('MONGODB_COLLECTION'):
    app.config['MONGODB_COLLECTION'] = MONGODB_COLLECTION
if not app.config.get('MONGODB_CREDENTIAL_SECRET'):
    app.config['MONGODB_CREDENTIAL_SECRET'] = MONGODB_CREDENTIAL_SECRET
if not app.config.get('BEDROCK_MODEL_ID'):
    app.config['BEDROCK_MODEL_ID'] = BEDROCK_MODEL_ID

def get_s3_client():
    if 's3_client' not in g:
        g.s3_client = boto3.client('s3', region_name=app.config['REGION_NAME'])
    return g.s3_client

def get_textract_client():
    if 'textract_client' not in g:
        g.textract_client = boto3.client("textract", region_name=app.config['REGION_NAME'])
    return g.textract_client

def get_bedrock_client():
    if 'bedrock_client' not in g:
        g.bedrock_client = boto3.client(
            service_name = 'bedrock-runtime',
            region_name = app.config['REGION_NAME']
        )
    return g.bedrock_client

def get_secretsmanager_client():
    if 'secretsmanager_client' not in g:
        g.secretsmanager_client = boto3.client(
            service_name = 'secretsmanager',
            region_name = app.config['REGION_NAME']
        )
    return g.secretsmanager_client

@app.route('/', methods = ['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'health check OK'}), 200

@app.route('/extract/<doc_type>', methods = ['POST'])
def extract(doc_type):
    s3 = get_s3_client()
    textract_client = get_textract_client()
    bedrock = get_bedrock_client()
    secrets_manager = get_secretsmanager_client()
    
    data = request.get_json()
    base64_file = data.get('document')
    filename = data.get('filename')
    doc_issued_by = "" if not data.get('issued_by') else data.get('issued_by')
    
    if base64_file and filename:
        file = base64.b64decode(base64_file)
        _, file_ext = os.path.splitext(filename)
        content_type = "application/pdf" if file_ext[1:] == "pdf" else "image/" + file_ext[1:]
        extra_args = {
            'ContentType': content_type,
        }
        
        try:
            s3_key = f"{app.config['UPLOAD_FOLDER']}{doc_type}/{filename}"
            s3_file_path = f"s3://{app.config['BUCKET_NAME']}/{s3_key}"
            s3.put_object(Bucket=app.config['BUCKET_NAME'], Key=s3_key, Body=file, **extra_args)
        except Exception as e: 
            return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(e)}), 500
        
        try:
            loader = AmazonTextractPDFLoader(s3_file_path, client=textract_client)
            documents = loader.load()
            text = " ".join([document.page_content for document in documents])
        except Exception as e:
            return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(e)}), 500
        
        db_creds_secret = secrets_manager.get_secret_value(
            SecretId=app.config['MONGODB_CREDENTIAL_SECRET']
        )
        db_creds_val = json.loads(db_creds_secret['SecretString'])
        
        conn_uri = app.config['MONGODB_CONNECTION_STRING'].replace("<db_user>", db_creds_val['mongodb_user']).replace("<db_password>", db_creds_val['mongodb_pass'])
        try:
            db_mgr = MongoDBManager(conn_uri, app.config['MONGODB_DATABASE'], collection=app.config['MONGODB_COLLECTION'])
            config = db_mgr.find_document_by_doc_type_and_issued_by( doc_type, doc_issued_by )    
        except Exception as error: 
            return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(error)}), 500
        
        result = invoke_bedrock_model_extraction(bedrock, app.config.get('BEDROCK_MODEL_ID'), config['prompt'].replace("{document}", text))
        try:
            result_object = json.loads(result)
        except ValueError as error:
            return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(error)}), 500
        result_object["s3_url"] = s3_file_path

        username = config['db_username']
        password = config['db_password']
        
        conn_uri = app.config['MONGODB_CONNECTION_STRING'].replace("<db_user>", username).replace("<db_password>", password)
        try:
            db_mgr = MongoDBManager(conn_uri, config["db_name"], collection=config['col_name'])
            result = db_mgr.insert_one_document(result_object)
        except Exception as error: 
            return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(error)}), 500
        
        return jsonify({'status': 'success', 'result': result['document'], 's3_url': s3_file_path, 'message': f"Extracted result is successfully stored in collection {config['col_name']} of database {config['db_name']}" }), 200
    else:
        return jsonify({'status': 'error', 'error_code': 400, 'error_message': 'One of document, filename is missing'}), 400

if __name__ == '__main__':
    from waitress import serve
    serve(app, host="0.0.0.0", port=6000)