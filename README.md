# vulcan

## Set Up Backend (Agent)

```shell
cd backend
pip install -e .
pip install "langgraph-cli[inmem]"
export SUPABASE_URL=
export SUPABASE_SERVICE_KEY=
export SUPABASE_JWT_SECRET=
export OXP_BEARER_TOKEN=
export OXP_BASE_URL=
export OPENAI_API_KEY=
export LANGSMITH_API_KEY=
export LANGSMITH_TRACING=true
```

## Set Up Frontend

.env file:
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