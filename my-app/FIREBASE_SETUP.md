# AgentForge MVP — Firebase Setup Guide
# Run these steps ONCE before starting development

## Step 1: Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" → Name it "agentforge-mvp"
3. Disable Google Analytics (not needed)
4. Click "Create project"

## Step 2: Add a Web App

1. In your project dashboard, click the Web icon (</>)
2. Register app name: "AgentForge Web"
3. Copy the firebaseConfig values into your .env.local file

## Step 3: Create Firestore Database

1. In the left sidebar, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select region: "us-central1 (Iowa)"
5. Click "Enable"

## Step 4: Create Required Collections

The app will create these automatically, but you can pre-create them:
- agents       (stores agent configurations)
- escalations  (stores human approval queue)
- traces       (stores decision trace steps)
- trace_summaries (stores completed trace summaries)

## Step 5: Add Firestore Indexes (Required for queries)

Go to Firestore > Indexes > Add Index:

Collection: escalations
Fields: tenantId (Ascending), status (Ascending), createdAt (Descending)
Query scope: Collection

Collection: trace_summaries
Fields: tenantId (Ascending), timestamp (Descending)
Query scope: Collection

Collection: traces
Fields: traceId (Ascending), stepOrder (Ascending)
Query scope: Collection

## Step 6: Update Security Rules (for production)

Go to Firestore > Rules and replace with:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // For MVP demo — lock down properly before going to production
    match /{document=**} {
      allow read, write: if true; // Change this in production!
    }
  }
}

## Step 7: Configure the AI Provider

The chat and embedding models are switchable with environment variables (see lib/ai.ts):

  AI_CHAT_MODEL=openai:gpt-5.4-mini                 # default; or google:gemini-flash-lite-latest
  AI_EMBEDDING_MODEL=openai:text-embedding-3-small  # default; or google:gemini-embedding-2

Add the key for each provider you use to .env.local:

- OpenAI: create a key at https://platform.openai.com/api-keys and set OPENAI_API_KEY
- Gemini: create a key at https://aistudio.google.com/app/apikey and set GEMINI_API_KEY

Changing AI_EMBEDDING_MODEL requires re-indexing documents (npm run demo:setup, or
re-upload them in the admin portal). Until then, chat falls back to the stored document text.

## Step 8: Restart the Dev Server

After filling in .env.local:
  npm run dev

Then open:
  http://localhost:3000/demo    <- Live chat with real AI
  http://localhost:3000/studio  <- Deploy agent configs
  http://localhost:3000/escalation <- Human approval queue
