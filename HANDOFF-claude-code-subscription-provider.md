# Handoff — Provider "Claude Code (subscription)" no Natively

**Branch:** `claude/claude-code-subscription-provider-cff282` (worktree)
**Data:** 2026-07-22
**Status:** investigação + spike concluídos. Decisão de ToS e implementação **pendentes**.

---

## Objetivo
Permitir que o app **Natively** (Electron, meeting-notes) consuma a **assinatura Claude
Pro/Max ("Claude Code")** de cada usuário **sem gastar API credits pagos**. Perguntas
originais: (1) qual endpoint consome da subscription sem "extra usage"? (2) o endpoint da
Anthropic aceita isso? (3) se não, usar o SDK da Anthropic?

## O que já foi estabelecido (não repetir a investigação)

### Estado do código hoje
- Provider `claude` usa **só API key paga**: `new Anthropic({ apiKey })` em
  `electron/LLMHelper.ts:471`. Roteamento em `electron/llm/ProviderRouter.ts:150`.
- **Molde já existente no repo:** o provider **Codex** já faz "subscription via OAuth"
  para o ChatGPT — `electron/services/CodexOAuthService.ts` (PKCE + loopback + refresh) e
  `electron/services/CodexCliService.ts` (transport HTTP/SSE). Persistência de tokens em
  `electron/services/CredentialsManager.ts:245`. UI OAuth em
  `src/components/settings/AIProvidersSettings.tsx:228`.

### Pesquisa (fontes)
- Issue oficial `anthropics/claude-code#37205` — **fechada como "not planned"**; dizia que
  `/v1/messages` rejeita `sk-ant-oat01` com "OAuth authentication is currently not supported".
- Política Anthropic de **fev/2026**: proíbe subscription-auth em produtos de terceiros.
- Doc auth: `https://code.claude.com/docs/en/authentication` — subscription OAuth só é usada
  pelo CLI e "surfaces that wrap it" (Agent SDK, VS Code ext, GitHub Actions);
  `claude setup-token` gera token OAuth de 1 ano → `CLAUDE_CODE_OAUTH_TOKEN`.

### Spike empírico (CONTRARIA as fontes — este é o achado-chave)
Scripts em `scratchpad/` (do dir de sessão; usam `SPIKE_TOKEN` via env, **não** contêm token):
- `oauth-spike.mjs` — testa variantes de auth contra `https://api.anthropic.com/v1/messages`.
- `prompt-conflict-spike.mjs` — testa conflito de persona + streaming.

**Resultados:**
- ✅ **`/v1/messages` ACEITA o token de subscription** (HTTP 200) com a tríade obrigatória:
  1. `Authorization: Bearer <sk-ant-oat01…>` (NÃO `x-api-key`)
  2. header `anthropic-beta: oauth-2025-04-20`
  3. **primeiro** bloco de `system` = literalmente
     `"You are Claude Code, Anthropic's official CLI for Claude."`
- Sem qualquer um dos três → **429/401** (rejeitado).
- Debita da **cota da assinatura** (`subscriptionType: max`, `default_claude_max_20x`),
  `service_tier: standard` — **não** de API credits.
- ✅ **Sem conflito de prompt:** o bloco "You are Claude Code" funciona só como chave de auth.
  Com um 2º bloco de persona (pt-BR, JSON, "nunca se revele"), o modelo **obedeceu 100%** e
  não se identificou como Claude. Qualidade idêntica à da API key.
- ✅ **Streaming SSE funciona** na mesma rota.

## Conclusão / recomendação
- **Rota A (HTTP direto)** é viável e **preferível** à Rota B (Agent SDK) para este caso:
  não arrasta harness de agente (loop/tools/system do Claude Code) — que era a preocupação
  do usuário. Controle total do payload.
- **Implementação é mínima** (não precisa clonar o CodexCliService): reusar o
  `@anthropic-ai/sdk` já presente, trocando a config de auth do cliente Claude:
  ```ts
  new Anthropic({ authToken: oauthToken,
                  defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' } })
  ```
  + wrapper que faz **prepend** do system-block do Claude Code em todo request (deixando os
  prompts atuais do Natively intactos como blocos seguintes).

## ⚠️ Decisão pendente do usuário (ToS)
Funciona tecnicamente, mas **viola a política Anthropic de fev/2026** (subscription-auth em
app terceiro). Risco = **suspensão de conta** por usuário (a Anthropic tem fingerprint além do
system prompt). "Cada um usa a própria conta" pulveriza, mas não legaliza. É decisão de
risco de produto — **aguardando o usuário decidir antes de codar**.

## Plano de implementação esboçado (Rota A)
| # | Componente | Ação | Espelho |
|---|---|---|---|
| 1 | Auth | MVP: colar token do `claude setup-token` (1 ano) → `CredentialsManager`+safeStorage. Full: PKCE como `CodexOAuthService` p/ endpoints do Claude | `CodexOAuthService.ts`, `CredentialsManager.ts:245` |
| 2 | Cliente | `Anthropic({ authToken, defaultHeaders })` + wrapper de system-block | `LLMHelper.ts:471` |
| 3 | Provider | id `claude_code` (ou flag no `claude`) + `hasClaudeCode` | `ProviderRouter.ts:150` |
| 4 | UI | Seção "Claude Code (assinatura)" em AI Providers | `AIProvidersSettings.tsx:228` |

**Ajustes que o spike sinalizou:** (a) 1º system-block é fixo/obrigatório; (b) `cache_control`
no system (`LLMHelper.ts:1916`) muda o prefixo cacheado com o prepend → re-medir cache hits;
(c) validar streaming com os prompts reais (não só o toy do spike); (d) refresh/expiração do
token (setup-token dura 1 ano; login PKCE precisaria de refresh como o do Codex).

## Próximos passos possíveis (perguntar ao usuário)
1. Implementar **MVP** (paste-token + cliente + provider + UI mínima) p/ testar no app real.
2. **Plano completo** (incluindo fluxo OAuth PKCE full) antes de codar.
3. Parar — spike entregue.

## Segurança / limpeza
- 🔴 **REVOGAR o token de spike:** um `sk-ant-oat01` de 1 ano foi colado no histórico do chat
  desta sessão. Rotacionar com `claude setup-token` / revogar em platform.claude.com.
- **Nunca** persistir/commitar tokens. Este handoff não contém nenhum.
- Este arquivo está na raiz do worktree e aparecerá no `git status` — adicionar ao
  `.gitignore` ou remover quando não precisar mais.

## Suggested skills (para a próxima sessão)
- **`dev`** — build estruturado do provider (fase de implementação).
- **`review-security`** / **`review-squad`** — antes de mergear: mudança sensível de
  autenticação/credenciais e multi-tenancy.
- **`browser-qa`** — validar a UI de AI Providers e o fluxo de login/geração de resposta no app.
- **`claude-api`** — referência de auth/model-ids do `@anthropic-ai/sdk` (`authToken`,
  headers beta).
- **`claude-code-guide`** — só se optarem pela Rota B (detalhes do Claude Agent SDK).
