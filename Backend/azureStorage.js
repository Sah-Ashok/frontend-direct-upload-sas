const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();


const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

const containerName = "profile-images";

async function createContainerIfNotExists() {
  const containerClient = blobServiceClient.getContainerClient(containerName);

  await containerClient.createIfNotExists();

  console.log(`Container ready : ${containerName}`);
}

async function deleteUserFolder(userId){
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const prefix = `${userId}/`;

  for await(const blob of containerClient.listBlobsFlat({ prefix})){
    const blockBlobClient = containerClient.getBlockBlobClient(blob.name);

    await blockBlobClient.delete();
    console.log(`Deleted blob: ${blob.name}`);
  }
}

module.exports = {
  blobServiceClient,
  containerName,
  createContainerIfNotExists,
  deleteUserFolder
};
