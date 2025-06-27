# Chatbot Frontend - Interface de Bate-papo com Webhooks

Este projeto é uma interface frontend de bate-papo que integra com n8n e Evolution API através de dois webhooks distintos.

## 🏗️ Arquitetura

```
Frontend (React) ←→ Servidor Local (Node.js) ←→ n8n ←→ Evolution API
```

### Fluxo de Comunicação

1. **Webhook 1 - Envio**: Frontend → n8n
   - Usuário digita mensagem no frontend
   - Frontend envia POST para webhook do n8n
   - n8n processa e envia para Evolution API

2. **Webhook 2 - Recebimento**: n8n → Frontend
   - Evolution API responde para n8n
   - n8n envia POST para servidor local
   - Servidor local envia para frontend via Server-Sent Events

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
cd chat-frontend-react
pnpm install
```

### 2. Iniciar o Servidor Local
```bash
# Terminal 1 - Servidor webhook
pnpm run server
```

### 3. Iniciar o Frontend
```bash
# Terminal 2 - Interface React
pnpm run dev
```

### 4. Acessar a Aplicação
- Frontend: http://localhost:5173
- Servidor: http://localhost:3001
- Health Check: http://localhost:3001/health

## ⚙️ Configuração dos Webhooks

### Webhook 1: Envio (Frontend → n8n)
- **URL**: Configure no frontend (ex: `https://seu-n8n.com/webhook/envio`)
- **Método**: POST
- **Body enviado**:
```json
{
  "message": "Mensagem do usuário",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "userId": "user-001",
  "sessionId": "session-123456"
}
```

### Webhook 2: Recebimento (n8n → Frontend)
- **URL**: `http://localhost:3001/webhook`
- **Método**: POST
- **Body esperado**:
```json
{
  "message": "Resposta da Evolution API",
  "from": "Bot",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "sessionId": "session-123456"
}
```

## 🔧 Configuração do n8n

### Workflow Sugerido

1. **Trigger Webhook** (Webhook 1)
   - URL: `/webhook/envio`
   - Método: POST
   - Recebe mensagens do frontend

2. **HTTP Request** (Para Evolution API)
   - Envia mensagem para Evolution API
   - Processa resposta

3. **HTTP Request** (Webhook 2)
   - URL: `http://localhost:3001/webhook`
   - Método: POST
   - Envia resposta de volta para o frontend

### Exemplo de Configuração no n8n

```json
{
  "nodes": [
    {
      "name": "Webhook Receber",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "envio",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Evolution API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://sua-evolution-api.com/message",
        "method": "POST"
      }
    },
    {
      "name": "Enviar Resposta",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://localhost:3001/webhook",
        "method": "POST"
      }
    }
  ]
}
```

## 🧪 Testes

### Testar Servidor Local
```bash
# Verificar status
curl http://localhost:3001/health

# Enviar mensagem de teste
curl -X POST http://localhost:3001/test-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Teste do servidor"}'
```

### Testar Webhook de Recebimento
```bash
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá do n8n!", "from": "Bot"}'
```

## 📁 Estrutura do Projeto

```
chat-frontend-react/
├── src/
│   ├── components/ui/     # Componentes UI (shadcn/ui)
│   ├── App.jsx           # Componente principal
│   ├── App.css           # Estilos
│   └── main.jsx          # Entry point
├── server.js             # Servidor Node.js para webhooks
├── package.json          # Dependências
└── README.md            # Esta documentação
```

## 🔒 Segurança

- Configure CORS adequadamente para produção
- Use HTTPS em produção
- Valide todas as entradas de dados
- Implemente autenticação se necessário

## 🚀 Deploy

### Frontend
```bash
pnpm run build
# Deploy da pasta dist/ para seu provedor de hospedagem
```

### Servidor
```bash
# Configure variáveis de ambiente
export PORT=3001
node server.js
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Frontend não conecta ao servidor**
   - Verifique se o servidor está rodando na porta correta
   - Confirme as configurações de CORS

2. **Mensagens não chegam do n8n**
   - Verifique a URL do webhook no n8n
   - Confirme o formato do JSON enviado

3. **Erro de CORS**
   - Adicione a origem do frontend nas configurações do servidor

### Logs

- Servidor: Console do Node.js
- Frontend: DevTools do navegador
- n8n: Logs do workflow

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor e frontend
2. Teste os endpoints individualmente
3. Confirme a configuração do n8n

