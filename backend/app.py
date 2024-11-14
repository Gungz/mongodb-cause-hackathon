from flask import Flask, request, jsonify, g
import os
import boto3
from langchain_community.document_loaders import AmazonTextractPDFLoader
import json
import base64
from helper import *
from MongoDBManager import *
from flask_cors import CORS, cross_origin
import os
from S3Url import *

app = Flask(__name__)
app.config.from_prefixed_env()
app.config['CORS_HEADERS'] = 'Content-Type'
if not app.config.get('CORS_ALLOWED_URL'):
    app.config['CORS_ALLOWED_URL'] = "http://localhost:3000"
CORS(app, resources={r"/*": {"origins": app.config['CORS_ALLOWED_URL']}})

SAMPLES_FOLDER = ''
BUCKET_NAME = ''
REGION_NAME = 'us-east-1'
MONGODB_CONNECTION_STRING = ''
MONGODB_DATABASE = ''
MONGODB_COLLECTION = ''
MONGODB_CREDENTIAL_SECRET = ''
BEDROCK_MODEL_ID = "us.anthropic.claude-3-5-haiku-20241022-v1:0"

if not app.config.get('SAMPLES_FOLDER'):
    app.config['SAMPLES_FOLDER'] = SAMPLES_FOLDER
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

@app.route('/upload_sample', methods = ['POST'])
@cross_origin()
def upload_sample():
    s3 = get_s3_client()
    data = request.get_json()
    base64_file = data.get('document') 
    filename = data.get('filename')
    _, file_ext = os.path.splitext(filename)
    content_type = "application/pdf" if file_ext[1:] == "pdf" else "image/" + file_ext[1:]
    extra_args = {
        'ContentType': content_type,
    }
    if base64_file and filename:
        file = base64.b64decode(base64_file)
        try:
            s3_key = f"{app.config['SAMPLES_FOLDER']}{filename}"
            s3.put_object(Bucket=app.config['BUCKET_NAME'], Key=s3_key, Body=file, **extra_args)
            presigned_url = generate_presigned_url(app.config['BUCKET_NAME'], s3_key, s3_client=s3)
        except Exception as e: 
            return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(e)}), 500
        return jsonify({'status': 'success', 's3_url': presigned_url, 's3_bucket': app.config['BUCKET_NAME'], 's3_key': s3_key }), 200        
    else:
        return jsonify({'status': 'error', 'error_code': 400, 'error_message': 'One of document, filename is missing'}), 400

@app.route('/test_prompt', methods = ['POST'])
@cross_origin()
def test_prompt():
    s3 = get_s3_client()
    textract_client =get_textract_client()
    bedrock = get_bedrock_client()

    data = request.get_json()
    prompt = data.get('prompt')
    s3_key = data.get('object_key')
    model_id = app.config['BEDROCK_MODEL_ID']

    if prompt and s3_key:
        try:
            s3_file_path = f"s3://{app.config['BUCKET_NAME']}/{s3_key}"
        except Exception as e: 
            return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(e)}), 500
        try:
            loader = AmazonTextractPDFLoader(s3_file_path, client=textract_client)
            documents = loader.load()
            text = " ".join([document.page_content for document in documents])
        except Exception as e:
            return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(e)}), 500 
        result = invoke_bedrock_model_extraction(bedrock, model_id, prompt.replace("{document}", text))
        return jsonify({'status': 'success', 'result': json.loads(result), 's3_url': s3_file_path }), 200        
    else:
        return jsonify({'status': 'error', 'error_code': 400, 'error_message': 'One of document, filename, prompt is missing'}), 400

@app.route('/check_collection', methods = ['POST'])
def check_collection():
    data = request.get_json()
    col_name = data.get('col_name')
    host = data.get('host')
    port = data.get("port") if data.get('port') else ""
    database = data.get('database')
    username = data.get('username')
    password = data.get('password')

    uri = f"mongodb+srv://{username}:{password}@{host}{port}/?retryWrites=true&w=majority"
    try:
        MongoDBManager(uri, database, collection=col_name)
        return jsonify({'status': 'success', 'message': "Database and collection already exist"}), 200
    except Exception as e:
        err_arr = str(e).split(",")
        if (err_arr[0] == "000"):
            return jsonify({'status': 'error', 'error_code': 404, 'message': "Check the DB information given: the host must already exist, port must be correct, network access must be allowed, username and password must be correct"}), 404
        else:
            return jsonify({'status': 'error', 'error_code': 400, 'message': f"{err_arr[1]}, however you can continue as MongoDB driver will only create database and collection the first time a document is inserted"}), 400    

@app.route('/save_config', methods = ['POST'])
def save_config():
    secrets_manager = get_secretsmanager_client()
    
    data = request.get_json()
    s3_url = f"s3://{app.config['BUCKET_NAME']}/{data.get('s3_key')}" 
    col_name = data.get('col_name')
    host = data.get('host')
    port = data.get("port") if data.get('port') else ""
    database = data.get('database')
    username = data.get('username')
    password = data.get('password')
    prompt = data.get('prompt')
    doc_type = data.get('document_type')
    doc_issued_by = data.get('document_issued_by')

    if s3_url and col_name and host and database and username and password and prompt and doc_type:
        config = {
            'db_host': host,
            'db_port': port,
            'db_name': database,
            'db_username': username,
            'db_password': password,
            'col_name': col_name,
            'prompt': prompt,
            's3_url': s3_url,
            'doc_type': doc_type,
            'doc_issued_by': doc_issued_by
        }
        
        db_creds_secret = secrets_manager.get_secret_value(
            SecretId=app.config['MONGODB_CREDENTIAL_SECRET']
        )
        db_creds_val = json.loads(db_creds_secret['SecretString'])

        conn_uri = app.config['MONGODB_CONNECTION_STRING'].replace("<db_user>", db_creds_val['mongodb_user']).replace("<db_password>", db_creds_val['mongodb_pass'])
        try:
            db_mgr = MongoDBManager(conn_uri, app.config['MONGODB_DATABASE'], collection=app.config['MONGODB_COLLECTION'])
            result = db_mgr.upsert_document( { 'doc_type': doc_type, 'doc_issued_by': doc_issued_by }, config )
            return jsonify({'status': 'success', 'configuration': result["updated_doc"]}), 200
        except Exception as e:
            return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(e)}), 500
    else:
        return jsonify({'status': 'error', 'error_code': 400, 'error_message': 'Only MongoDB port and document issued by can be empty, all other fields must be filled'}), 400
    
@app.route('/config/<config_id>', methods = ['GET'])
def get_config(config_id):
    secrets_manager = get_secretsmanager_client()
    s3 = get_s3_client()
    db_creds_secret = secrets_manager.get_secret_value(
            SecretId=app.config['MONGODB_CREDENTIAL_SECRET']
    )
    db_creds_val = json.loads(db_creds_secret['SecretString'])

    conn_uri = app.config['MONGODB_CONNECTION_STRING'].replace("<db_user>", db_creds_val['mongodb_user']).replace("<db_password>", db_creds_val['mongodb_pass'])
    try:
        db_mgr = MongoDBManager(conn_uri, app.config['MONGODB_DATABASE'], collection=app.config['MONGODB_COLLECTION'])
        config = db_mgr.find_document( config_id )
        s = S3Url(config["s3_url"])
        presigned_url = generate_presigned_url(s.bucket, s.key, s3)
        return jsonify({'status': 'success', 'result': config, 's3_url': presigned_url, 's3_key': s.key }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(e)}), 500

@app.route('/configs', methods = ['GET'])
def get_all_configs():
    secrets_manager = get_secretsmanager_client()
    db_creds_secret = secrets_manager.get_secret_value(
            SecretId=app.config['MONGODB_CREDENTIAL_SECRET']
    )
    db_creds_val = json.loads(db_creds_secret['SecretString'])

    conn_uri = app.config['MONGODB_CONNECTION_STRING'].replace("<db_user>", db_creds_val['mongodb_user']).replace("<db_password>", db_creds_val['mongodb_pass'])
    try:
        db_mgr = MongoDBManager(conn_uri, app.config['MONGODB_DATABASE'], collection=app.config['MONGODB_COLLECTION'])
        config_list = db_mgr.get_all_documents()        
        return jsonify({'status': 'success', 'result': config_list }), 200
    except Exception as e: 
        return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(e)}), 500

@app.route('/delete_config/<config_id>', methods = ['DELETE'])
def delete_config(config_id):
    secrets_manager = get_secretsmanager_client()
    db_creds_secret = secrets_manager.get_secret_value(
            SecretId=app.config['MONGODB_CREDENTIAL_SECRET']
    )
    db_creds_val = json.loads(db_creds_secret['SecretString'])
    
    conn_uri = app.config['MONGODB_CONNECTION_STRING'].replace("<db_user>", db_creds_val['mongodb_user']).replace("<db_password>", db_creds_val['mongodb_pass'])
    try:
        db_mgr = MongoDBManager(conn_uri, app.config['MONGODB_DATABASE'], collection=app.config['MONGODB_COLLECTION'])
        result = db_mgr.delete_document(config_id)
        return jsonify({'status': 'success', 'message': f"Configuration successfully deleted" }), 200
    except Exception as error: 
        return jsonify({'status': 'error', 'error_code': 500, 'error_message': str(error)}), 500

@app.route('/', methods = ['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'health check OK'}), 200

if __name__ == '__main__':
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)
