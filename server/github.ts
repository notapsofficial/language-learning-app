import { Octokit } from '@octokit/rest'

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export async function createRepository(name: string, description: string = '') {
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Create the repository
    const response = await octokit.rest.repos.createForAuthenticatedUser({
      name,
      description,
      private: false,
      auto_init: false
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating repository:', error);
    throw error;
  }
}

export async function uploadFiles(repoOwner: string, repoName: string, files: { path: string; content: string; encoding?: string }[]) {
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Upload files one by one
    const results = [];
    for (const file of files) {
      try {
        const response = await octokit.rest.repos.createOrUpdateFileContents({
          owner: repoOwner,
          repo: repoName,
          path: file.path,
          message: `Add ${file.path}`,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64'
        });
        results.push({ path: file.path, success: true, sha: response.data.content?.sha });
      } catch (error) {
        console.error(`Error uploading ${file.path}:`, error);
        results.push({ path: file.path, success: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
}