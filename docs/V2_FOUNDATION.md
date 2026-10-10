# FreteTruck V2 Foundation — segurança e release

## Situação
Este pacote é a primeira etapa de correções, para revisão por PR. Não comprova prontidão comercial ou conformidade legal. Evitar merge sem passar CI e testes manuais.

## Instalação inicial
1. Configurar DATABASE_URL e AUTH_SECRET aleatório forte.
2. Definir temporariamente SETUP_TOKEN de 32+ caracteres, armazenado apenas como variável protegida no provedor.
3. Enviar POST /api/setup com header `x-setup-token`. Nenhuma conta administrativa padrão é criada.
4. Provisionar a primeira conta admin por um procedimento privado, auditado e com senha exclusiva (não expor senha no repositório nem em documentação pública).
5. Remover SETUP_TOKEN após concluir o bootstrap. Admin autenticado pode sincronizar o schema pela área administrativa.

**Antes de lançar**: verificar se já existe `demo@fretetruck.com.br` no banco antigo. Caso exista, revogar o acesso/alterar credenciais imediatamente. O bloqueio de criação automática não remove contas anteriores.

## Pagamentos
O endpoint /api/trucks/orders/:id/pay agora é reservado a administradores em desenvolvimento e bloqueado em produção. Em produção, somente liquidação confirmada por provedor confiável deve creditar saldo. Verificar também o processamento transacional/idempotente do webhook antes de habilitar vendas em escala.

## Rastreamento
Localização real passa a exigir uma proposta aceita para publicação. O dono da carga, o motorista designado e admin podem consultar. O endpoint de simulação identifica claramente dados simulados e não grava `tracking_active`. Autorização deve ser testada com três perfis distintos.

## Documentos
Uploads de documentos reais exigem arquivo JPEG, PNG ou PDF e são privados no endpoint; o fallback de documento de demonstração foi removido. Inspecionar e limpar cópias legadas em `public/uploads` nos servidores existentes, pois arquivos já publicados estaticamente não são protegidos por autorização da API.

## CI
O repositório original não inclui lockfile na raiz. Os jobs foram adaptados para `npm install` até gerar e revisar um `package-lock.json`, quando poderão retornar a `npm ci`. Verificar lint, tipagem, build Next e Docker no PR.

## QA mínimo antes do merge
- POST /api/setup anônimo recebe 403 e não altera tabelas.
- Sem AUTH_SECRET, produção deve falhar ao inicializar a autenticação.
- Usuário comum não pode confirmar créditos manualmente; em produção, ninguém pode.
- Webhook rejeita divergência entre valor do pedido e valor pago.
- Usuário não vinculado não pode ler GPS; somente motorista com proposta aceita envia posições.
- Documento de outra conta recebe 403; documento ausente recebe 404; nenhuma imagem finge estar verificada.
- Cadastro/login, publicação, proposta, aceite, chat e painel continuam funcionando.
- CI verde e screenshots em desktop/mobile da experiência central.

## Próximas etapas
1. Testes de integração para pagamentos e rastreamento, rate limiting e revisão das sessões.
2. Substituir armazenamento de documentos em base64 por storage privado com URLs de curta duração.
3. Modelar permissões de frota / motoristas designados, além de proposta aceita.
4. Atualizar piso ANTT por dados oficiais e rotular CT-e/MDF-e como simulações até emissão efetiva.
5. Consertar aplicativo Expo (entry point, assets, permissões, API auth e EAS) e testar build.
