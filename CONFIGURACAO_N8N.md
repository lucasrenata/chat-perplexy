# Configuração do n8n para Integração com Chatbot

Este documento fornece instruções detalhadas para configurar os webhooks no n8n para integração com o frontend de chatbot e Evolution API.

## 📋 Visão Geral

O sistema utiliza **dois webhooks distintos**:

1. **Webhook 1**: Frontend → n8n (recebe mensagens do usuário)
2. **Webhook 2**: n8n → Frontend (envia respostas de volta)

## 🔧 Configuração do Workflow no n8n

### Passo 1: Criar Novo Workflow

1. Acesse seu n8n
2. Clique em "New Workflow"
3. Nomeie como "Chatbot Integration"

### Passo 2: Configurar Webhook 1 (Recebimento)

1. **Adicionar nó "Webhook"**
   - Arraste o nó "Webhook" para o canvas
   - Configure:
     - **HTTP Method**: POST
     - **Path**: `envio-mensagem`
     - **Response Mode**: Respond Immediately
     - **Response Code**: 200

2. **Dados recebidos do frontend**:
```json
{
  "message": "Mensagem do usuário",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "userId": "user-001",
  "sessionId": "session-123456"
}
```

### Passo 3: Configurar Integração com Evolution API

1. **Adicionar nó "HTTP Request"**
   - Conecte ao webhook anterior
   - Configure:
     - **Method**: POST
     - **URL**: `https://sua-evolution-api.com/message/sendText/sua-instancia`
     - **Headers**:
       ```json
       {
         "Content-Type": "application/json",
         "apikey": "SUA_API_KEY_EVOLUTION"
       }
       ```
     - **Body**:
       ```json
       {
         "number": "5511999999999",
         "text": "{{ $json.message }}"
       }
       ```

2. **Aguardar resposta da Evolution API**
   - A Evolution API retornará uma resposta
   - Capture o campo de resposta (geralmente `response.text` ou similar)

### Passo 4: Configurar Webhook 2 (Envio de Resposta)

1. **Adicionar nó "HTTP Request"** (para enviar de volta ao frontend)
   - Conecte ao nó anterior
   - Configure:
     - **Method**: POST
     - **URL**: `http://localhost:3001/webhook`
     - **Headers**:
       ```json
       {
         "Content-Type": "application/json"
       }
       ```
     - **Body**:
       ```json
       {
         "message": "{{ $json.response_text }}",
         "from": "Evolution Bot",
         "timestamp": "{{ $now }}",
         "sessionId": "{{ $('Webhook').first().json.sessionId }}"
       }
       ```

## 🔄 Exemplo de Workflow Completo

```json
{
  "name": "Chatbot Integration",
  "nodes": [
    {
      "parameters": {
        "path": "envio-mensagem",
        "httpMethod": "POST",
        "responseMode": "respondImmediately"
      },
      "name": "Webhook Receber Mensagem",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://sua-evolution-api.com/message/sendText/sua-instancia",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "SUA_API_KEY"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "number",
              "value": "5511999999999"
            },
            {
              "name": "text",
              "value": "={{ $json.message }}"
            }
          ]
        }
      },
      "name": "Enviar para Evolution",
      "type": "n8n-nodes-base.httpRequest",
      "position": [460, 300]
    },
    {
      "parameters": {
        "url": "http://localhost:3001/webhook",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "message",
              "value": "={{ $json.response_text }}"
            },
            {
              "name": "from",
              "value": "Evolution Bot"
            }
          ]
        }
      },
      "name": "Enviar Resposta Frontend",
      "type": "n8n-nodes-base.httpRequest",
      "position": [680, 300]
    }
  ],
  "connections": {
    "Webhook Receber Mensagem": {
      "main": [
        [
          {
            "node": "Enviar para Evolution",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Enviar para Evolution": {
      "main": [
        [
          {
            "node": "Enviar Resposta Frontend",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 🧪 Testando a Integração

### 1. Testar Webhook 1 (Recebimento)
```bash
curl -X POST https://seu-n8n.com/webhook/envio-mensagem \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá, teste do webhook!",
    "userId": "user-001",
    "sessionId": "session-123"
  }'
```

### 2. Verificar Logs do n8n
- Acesse a aba "Executions" no n8n
- Verifique se o workflow foi executado
- Analise os dados em cada nó

### 3. Verificar Recebimento no Frontend
- O frontend deve receber a resposta automaticamente
- Verifique o console do navegador para logs

## 🔒 Configurações de Segurança

### Headers de Autenticação
```json
{
  "Authorization": "Bearer SEU_TOKEN",
  "X-API-Key": "SUA_CHAVE_API"
}
```

### Validação de Dados
Adicione nós de validação para verificar:
- Formato das mensagens
- Presença de campos obrigatórios
- Tamanho máximo das mensagens

## 🚨 Troubleshooting

### Problema: Webhook não recebe dados
**Solução**: Verifique se:
- A URL está correta
- O método HTTP é POST
- O Content-Type é application/json

### Problema: Evolution API não responde
**Solução**: Verifique:
- Credenciais da API
- Status da instância
- Formato do número de telefone

### Problema: Frontend não recebe resposta
**Solução**: Verifique:
- Se o servidor local está rodando
- Se a URL do webhook 2 está correta
- Se o formato JSON está correto

## 📞 URLs de Configuração

- **Webhook 1 (n8n)**: `https://seu-n8n.com/webhook/envio-mensagem`
- **Webhook 2 (Frontend)**: `http://localhost:3001/webhook`
- **Evolution API**: `https://sua-evolution-api.com/message/sendText/instancia`

## 📝 Logs e Monitoramento

### n8n
- Acesse "Executions" para ver histórico
- Use "Debug" mode para análise detalhada

### Frontend
- Console do navegador
- Network tab para requisições

### Servidor Local
- Logs no terminal onde o servidor está rodando
- Endpoint de health: `http://localhost:3001/health`

