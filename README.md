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
4. Copie `.env.example` para `.env.local` e preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
5. `npm install` e `npm start`.

## Estrutura

```
src/
  app/          rotas
  auth/         sessão e perfil (Supabase Auth)
  data/         chamadas ao Supabase e hooks com Realtime
  systems/      regras e cálculos de cada sistema de ficha
  pages/        Entrar, Minhas mesas, Nova mesa, Painel do mestre, Fichas, Livro
  components/   cards de conta, mapa
  ui/           ícones, popovers e peças visuais
  styles/       tokens e estilos globais
supabase/migrations/  schema do banco
```

## Privacidade

A ficha completa (`characters`) só é legível pelo próprio jogador. O mestre vê apenas
`character_status` (nome, vida/recursos, defesa e condições). Anotações do mestre (`gm_state`)
e o baú são visíveis só para o mestre; arquivos só chegam aos jogadores quando compartilhados.
