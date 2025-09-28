from .upload_helpers import upload_csv_to_db

def handle_whonet_upload(file_path):
    return upload_csv_to_db(file_path)
