"""
Deploy to existing Netlify site using API.
Requires a personal access token from: https://app.netlify.com/user/applications#personal-access-tokens
"""
import requests
import hashlib
import os
import sys

DEPLOY_DIR = "deploy"
SITE_ID = "boisterous-rabanadas-b53b64"

def get_file_hash(filepath):
    with open(filepath, 'rb') as f:
        return hashlib.sha1(f.read()).hexdigest()

def deploy(token):
    print("📦 Preparing files...")
    files = {}
    for root, dirs, filenames in os.walk(DEPLOY_DIR):
        for filename in filenames:
            filepath = os.path.join(root, filename)
            rel_path = '/' + os.path.relpath(filepath, DEPLOY_DIR).replace('\\', '/')
            files[rel_path] = get_file_hash(filepath)
    
    print(f"   Files: {list(files.keys())}")
    
    # Create deploy
    print("🚀 Deploying to Netlify...")
    resp = requests.post(
        f"https://api.netlify.com/api/v1/sites/{SITE_ID}/deploys",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        },
        json={"files": files}
    )
    
    if resp.status_code not in [200, 201]:
        print(f"❌ Deploy failed: {resp.status_code} - {resp.text[:200]}")
        return
    
    deploy_data = resp.json()
    deploy_id = deploy_data["id"]
    required = deploy_data.get("required", [])
    
    print(f"   Deploy ID: {deploy_id}")
    print(f"   Uploading {len(required)} files...")
    
    # Upload required files
    for file_hash in required:
        for rel_path, fhash in files.items():
            if fhash == file_hash:
                filepath = os.path.join(DEPLOY_DIR, rel_path.lstrip('/'))
                with open(filepath, 'rb') as f:
                    content = f.read()
                
                up_resp = requests.put(
                    f"https://api.netlify.com/api/v1/deploys/{deploy_id}/files{rel_path}",
                    headers={
                        "Content-Type": "application/octet-stream",
                        "Authorization": f"Bearer {token}"
                    },
                    data=content
                )
                status = "✅" if up_resp.status_code in [200, 201] else "❌"
                print(f"   {status} {rel_path}")
                break
    
    print("")
    print("=" * 55)
    print("✅ DEPLOYED SUCCESSFULLY!")
    print(f"🔗 https://{SITE_ID}.netlify.app")
    print("=" * 55)
    print("Share this link with anyone!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python deploy.py YOUR_NETLIFY_TOKEN")
        print("")
        print("Get your token from:")
        print("https://app.netlify.com/user/applications#personal-access-tokens")
        print("")
        print("Click 'New access token', give it a name, copy the token, then run:")
        print("  python deploy.py nfp_xxxxxxxxxxxxx")
    else:
        deploy(sys.argv[1])
