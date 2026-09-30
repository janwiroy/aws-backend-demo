
const fs = require("fs").promises;
const path = require("path");
const { s3, S3_BUCKET } = require("../config/aws-config");

async function pushRepo() {
  // Resolve the repository directory from the backend folder
  const repoPath = path.resolve(__dirname, "../.apnaGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    // Create the commits directory if it does not exist
    await fs.mkdir(commitsPath, { recursive: true });

    // Read all commit directories
    const commitDirs = await fs.readdir(commitsPath);

    if (commitDirs.length === 0) {
      console.log("No commits found to push.");
      return;
    }

    for (const commitDir of commitDirs) {
      const commitPath = path.join(commitsPath, commitDir);

      // Skip anything that is not a directory
      const stat = await fs.stat(commitPath);
      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(commitPath);

      for (const file of files) {
        const filePath = path.join(commitPath, file);

        // Skip anything that is not a file
        const fileStat = await fs.stat(filePath);
        if (!fileStat.isFile()) continue;

        const fileContent = await fs.readFile(filePath);

        const params = {
          Bucket: S3_BUCKET,
          Key: `commits/${commitDir}/${file}`,
          Body: fileContent,
        };

        await s3.upload(params).promise();

        console.log(`Uploaded: commits/${commitDir}/${file}`);
      }
    }

    console.log("All commits pushed to S3.");
  } catch (err) {
    console.error("Error pushing to S3:", err);
  }
}

module.exports = { pushRepo };