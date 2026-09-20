# Laetia — loja de artigos religiosos católicos

Next.js 15 + Supabase + Mercado Pago + Melhor Envio (Correios).

## O que já vem pronto
**Loja:** página inicial com itens escolhidos pelo admin · categorias · busca · página de produto com opções
(cor da pedra, entremeio, medalha, crucifixo, "com nome") · sacola · checkout · Mercado Pago · meus pedidos ·
suporte (tickets) · chat flutuante em tempo real · botão de WhatsApp · política de privacidade (modelo).

**Painel (/admin):** resumo · produtos (fotos, descrição, preço, opções, estoque) · categorias · pedidos ·
impressão de pedido + etiqueta (um ou vários de uma vez) · etiqueta oficial dos Correios (Melhor Envio) ·
mensagens/suporte · configurações (WhatsApp, frete, remetente).

## Instalação (passo a passo)

### 1. Supabase
1. Crie um projeto em supabase.com (região São Paulo).
2. **SQL Editor** → cole `supabase/schema.sql` → Run.
3. **Authentication → URL Configuration:** Site URL = endereço do seu site; adicione `https://SEUSITE/auth/callback` em Redirect URLs.
4. **Project Settings → API:** copie URL, anon key e service_role key.

### 2. Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha. Gere a chave de criptografia do CPF:
`openssl rand -base64 32` — **guarde uma cópia em local seguro** (se perder, os CPFs ficam ilegíveis).

### 3. Rodar
```
npm install
npm run dev
```
Abra http://localhost:3000, crie sua conta em "Entrar", depois no Supabase (SQL Editor):
```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'SEU@EMAIL.COM');
```
Agora `/admin` está liberado para você.

### 4. Mercado Pago
1. mercadopago.com.br/developers → crie uma aplicação → **Checkout Pro**.
2. Copie o **Access Token** para `MP_ACCESS_TOKEN` (comece pelas credenciais de teste).
3. **Webhooks:** URL `https://SEUSITE/api/mercadopago/webhook`, evento **Pagamentos**. Copie a **chave secreta** para `MP_WEBHOOK_SECRET`.

### 5. Melhor Envio (opcional, mas recomendado)
1. melhorenvio.com.br → Configurações → Tokens → gere um token (permissões de carrinho, cálculo, checkout, geração, impressão).
2. `MELHOR_ENVIO_TOKEN=...` (teste antes com `MELHOR_ENVIO_SANDBOX=true`).
3. Preencha o **remetente** em Admin → Configurações. Sem token, o frete usa o valor fixo definido lá.

### 6. Publicar na Netlify
1. Suba o código para um repositório no GitHub.
2. Netlify → **Add new site → Import an existing project** → escolha o repositório. O Next.js é detectado sozinho (o `netlify.toml` já está pronto).
3. **Site configuration → Environment variables:** cadastre todas as variáveis do `.env.example`
   (use o endereço `https://SEUSITE.netlify.app` em `NEXT_PUBLIC_SITE_URL` até ligar o domínio próprio).
4. Faça o deploy, depois ligue o domínio em **Domain management**, atualize `NEXT_PUBLIC_SITE_URL`, o Site URL do Supabase e a URL do webhook do Mercado Pago.
5. Use um plano pago (Personal ou Pro): no gratuito o site é suspenso ao atingir os limites.
6. Teste uma compra de ponta a ponta com credenciais de teste do Mercado Pago.

> Limite da Netlify: envios de até ~6 MB por vez. Por isso o painel aceita fotos de até 4 MB (5 MB no total por salvamento).

## Segurança — o que já está feito
- CPF criptografado (AES-256-GCM) no servidor; o navegador nunca lê o CPF completo.
- Regras de acesso no banco (RLS): cliente só vê os próprios dados/pedidos/conversas.
- Cliente não consegue se promover a admin nem alterar o CPF direto no banco (permissões por coluna).
- Preços e frete recalculados no servidor; valor do navegador é ignorado.
- Webhook do Mercado Pago com assinatura HMAC, consulta o pagamento na API e confere o valor.
- Chave `service_role` só no servidor; cabeçalhos de segurança; painel protegido por login + papel.
- Sem dados de cartão na loja.

## Montagem visual do terço
Na página do produto, o terço é desenhado na tela e muda a cada escolha (contas, entremeios, medalha, crucifixo;
o nome "com nome" aparece no centro do laço). Como configurar em Admin → Produtos → (produto) → Opções de escolha:
- Em cada grupo, escolha em **"Desenha:"** qual parte ele pinta (contas, entremeios, medalha ou crucifixo).
- Em cada opção, use o **quadradinho de cor** (cor da conta ou do metal). Na medalha/crucifixo, se a cor ficar vazia, usa a cor do entremeio.
- Medalha e crucifixo têm **formatos prontos** (oval/redonda/coração; simples/pontas alargadas/trabalhado) e aceitam **imagem própria** (PNG transparente, até 1 MB) que substitui o desenho.
- Vale para qualquer produto com grupos que tenham "Desenha:" marcado; sem isso, a página mostra só as fotos.
- Se você já tinha rodado o `schema.sql` antes desta versão, rode `supabase/migration-montagem-visual.sql`.

## Preparado para marketplaces (Mercado Livre, Shopee) no futuro
Sem mexer na estrutura: `products.sku`, `products.external_ids`, `orders.channel`, `orders.external_id`
(único por canal) e estoque central com baixa por função. A integração entra como um novo módulo que cria
pedidos com `channel='mercadolivre'` e sincroniza estoque.

## Antes de abrir para clientes (checklist)
- [ ] Testar compra completa no sandbox (MP + Melhor Envio).
- [ ] Revisar a Política de Privacidade e Termos com um advogado.
- [ ] Ligar 2FA em Supabase, Vercel, Mercado Pago e Melhor Envio.
- [ ] Plano pago no Supabase (backup diário) e ativar confirmação de e-mail no Auth.
- [ ] Personalizar e-mails do Supabase Auth (Authentication → Email Templates) em português.

## Ainda não incluído (próximos passos naturais)
E-mails transacionais (pedido pago/enviado), limitação de tentativas (rate limit) em login/APIs,
cupons, avaliações, notas fiscais, integração com marketplaces.
