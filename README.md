# SealM ON ONE — Central de Rankings

Site comunitário responsivo para arquivar diariamente os prints dos resets de 05h e 18h.

## Executar

```bash
npm install
npm run dev
```

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor e execute [supabase/setup.sql](supabase/setup.sql).
3. Em Authentication > Users, crie o usuário administrador com e-mail e senha.
4. Copie `.env.example` para `.env` e preencha a URL e a chave pública/publishable do projeto.
5. Na Vercel, crie as mesmas variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em Settings > Environment Variables.

Os prints ficam no Supabase Storage e os registros na tabela `rankings`. A página é pública para leitura, enquanto uploads e substituições exigem uma sessão autenticada.

No Windows, também é possível abrir a versão compilada executando `abrir-site.cmd`. Não abra `dist/index.html` diretamente: navegadores bloqueiam partes de aplicações JavaScript quando carregadas pelo protocolo `file://`.
