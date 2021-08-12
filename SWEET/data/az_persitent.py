from azure.storage.blob import BlobClient
import json

class AzurePersitentDict(dict):

    def __init__(self, connection, container, blobname):
        super().__init__()
        self.client = BlobClient.from_connection_string(connection, container, blobname)
        self.reload()

    def commit(self):
        self.client.upload_blob(json.dumps(self), overwrite=True)

    def reload(self):
        self.clear()
        if self.client.exists():
            self.update(json.loads(self.client.download_blob().readall()))