# quiz-api-mcp

Read-only MCP server for Quiz API discovery. It exposes only public search,
recommendation, quiz detail, category listing and published/public knowledge
search. No write tool is exported; mutation remains in the authenticated
FastAPI agent → NestJS approval/RBAC boundary.

Run locally:

```powershell
python ai-agent/mcp/quiz_api_server.py
```

For HTTP transport:

```powershell
$env:MCP_TRANSPORT = "streamable-http"
python ai-agent/mcp/quiz_api_server.py
```

Set `BACKEND_URL` and, only when required, a read-only `BACKEND_API_KEY`.
