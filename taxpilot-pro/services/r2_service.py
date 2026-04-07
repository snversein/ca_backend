import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv

load_dotenv()

class R2Service:
    def __init__(self):
        self.account_id = os.getenv('R2_ACCOUNT_ID', '')
        self.access_key = os.getenv('R2_ACCESS_KEY', '')
        self.secret_key = os.getenv('R2_SECRET_KEY', '')
        self.bucket_name = os.getenv('R2_BUCKET_NAME', 'taxpilot-documents')
        
        if self.account_id and self.access_key:
            self.client = boto3.client(
                's3',
                endpoint_url=f'https://{self.account_id}.r2.cloudflarestorage.com',
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                config=Config(signature_version='s3v4')
            )
        else:
            self.client = None
    
    def upload_file(self, key, content, content_type='application/octet-stream'):
        if not self.client:
            return {'error': 'R2 not configured', 'key': key}
        
        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=content,
                ContentType=content_type
            )
            return {'success': True, 'key': key}
        except ClientError as e:
            return {'error': str(e), 'key': key}
    
    def get_presigned_url(self, key, expires_in=3600):
        if not self.client:
            return f'https://{self.bucket_name}.localhost/{key}'
        
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': key},
                ExpiresIn=expires_in
            )
            return url
        except ClientError:
            return f'https://{self.bucket_name}.r2.cloudflarestorage.com/{key}'
    
    def delete_file(self, key):
        if not self.client:
            return {'success': True, 'key': key}
        
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=key)
            return {'success': True, 'key': key}
        except ClientError as e:
            return {'error': str(e)}
    
    def list_files(self, prefix=''):
        if not self.client:
            return {'files': []}
        
        try:
            response = self.client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    files.append({
                        'key': obj['Key'],
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'].isoformat()
                    })
            return {'files': files}
        except ClientError as e:
            return {'error': str(e), 'files': []}
    
    def download_file(self, key, local_path):
        if not self.client:
            return {'error': 'R2 not configured'}
        
        try:
            self.client.download_file(self.bucket_name, key, local_path)
            return {'success': True, 'path': local_path}
        except ClientError as e:
            return {'error': str(e)}

r2_service = R2Service()
