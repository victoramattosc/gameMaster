# Game Master

Mesa de RPG online para mestres e jogadores: o mestre cria a mesa e convida o grupo; cada jogador
abre a própria ficha (D&D 5e, Ordem Paranormal, Ordem Paranormal II ou sistema personalizado) com
cálculos automáticos, e o mestre acompanha vida, recursos e condições de todos em tempo real.

## Stack

- React 18 + TypeScript (Create React App) + SCSS modules
- Supabase: Auth (JWT), Postgres com RLS, Realtime e Storage

## Configuração

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode `supabase/migrations/0001_init.sql` (tabelas, policies, funções, buckets e realtime).
3. Em **Authentication → URL Configuration**, adicione a URL do app (ex.: `http://localhost:3000`) aos redirects.
4. Copie `.env.example` para `.env.local` e preencha `REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_ANON_KEY`.
5. `npm install` e `npm start`.

## Estrutura

```
src/
  app/          rotas
  auth/         sessão e perfil (Supabase Auth)
  data/         chamadas ao Supabase e hooks de dados
  db/           banco local (RxDB/IndexedDB): cache offline, sync com Realtime e fila de envio
  systems/      regras e cálculos de cada sistema de ficha
  pages/        Entrar, Minhas mesas, Nova mesa, Painel do mestre, Fichas, Livro
  components/   cards de conta, mapa
  ui/           ícones, popovers e peças visuais
  styles/       tokens e estilos globais
supabase/migrations/  schema do banco
```

## Dados offline (RxDB)

As telas leem sempre do banco local (um por usuário, no IndexedDB), então abrem na hora e
funcionam sem internet. Cada consulta é um "escopo" (`src/db/sync.ts`):

- se o cache tiver mais idade que o prazo do escopo (`STALE`), busca no servidor em segundo plano;
- enquanto a tela está aberta, o Realtime grava as mudanças direto no banco local, sem nova busca;
- a ficha e as anotações do mestre são gravadas primeiro no aparelho e enviadas depois
  (`src/db/outbox.ts`); sem internet, sobem sozinhas quando a conexão volta.

Ao sair da conta, o banco local do usuário é apagado.

## Privacidade

A ficha completa (`characters`) só é legível pelo próprio jogador. O mestre vê apenas
`character_status` (nome, vida/recursos, defesa e condições). Anotações do mestre (`gm_state`)
e o baú são visíveis só para o mestre; arquivos só chegam aos jogadores quando compartilhados.
