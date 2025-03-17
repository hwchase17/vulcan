# vulcan

## Set Up Backend (Agent)

Install the backend React Agent Server

```shell
cd backend
pip install -e .
pip install "langgraph-cli[inmem]"
```

Then copy the following to a `.env` file in the backend root directory

```bash
export SUPABASE_URL=
export SUPABASE_SERVICE_KEY=
export SUPABASE_JWT_SECRET=
export OXP_BEARER_TOKEN= # ARCADE_API_KEY (hosted demo)
export OXP_BASE_URL= # https://api.arcade.dev/v1/oxp (hosted demo)
export OPENAI_API_KEY=
export LANGSMITH_API_KEY=
export LANGSMITH_TRACING=true
```

## Set Up Frontend

Copy the following to a `.env` file in the frontend root directory

```shell
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_LANGCHAIN_API_URL=http://localhost:2024
VITE_ASSISTANT_ID=agent
```

```shell
npm i pnpm --global
pnpm install
pnpm run build
pnpm run dev
```

If running locally and using supabase Auth for the login,
you will need to go enable the Google Provider.
