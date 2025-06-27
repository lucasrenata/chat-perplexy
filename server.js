import express from 'express';
import cors from 'cors';
const app = express();

// Configuração da porta (pode ser alterada via variável de ambiente)
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite e Create React App
  credentials: true
}));
app.use(express.json());

// Array para armazenar clientes SSE conectados
let sseClients = [];

// Endpoint para Server-Sent Events (conexão com o frontend)
app.get('/events', (req, res) => {
  // Configurar headers para SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Adicionar cliente à lista
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response: res
  };
  sseClients.push(newClient);

  console.log(`Cliente SSE conectado: ${clientId}`);

  // Enviar mensagem de confirmação
  res.write(`data: ${JSON.stringify({ 
    type: 'connection', 
    message: 'Conectado ao servidor de recebimento',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Remover cliente quando a conexão for fechada
  req.on('close', () => {
    console.log(`Cliente SSE desconectado: ${clientId}`);
    sseClients = sseClients.filter(client => client.id !== clientId);
  });
});

// Webhook para receber mensagens do n8n (Evolution API → n8n → Frontend)
app.post('/webhook', (req, res) => {
  try {
    console.log('Webhook recebido:', req.body);
    
    const { message, from, timestamp, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        error: 'Mensagem é obrigatória',
        received: req.body 
      });
    }

    // Preparar dados para enviar ao frontend
    const messageData = {
      message: message,
      from: from || 'Bot',
      timestamp: timestamp || new Date().toISOString(),
      sessionId: sessionId
    };

    // Enviar mensagem para todos os clientes conectados via SSE
    sseClients.forEach(client => {
      try {
        client.response.write(`data: ${JSON.stringify(messageData)}\n\n`);
      } catch (error) {
        console.error('Erro ao enviar mensagem para cliente SSE:', error);
      }
    });

    console.log(`Mensagem enviada para ${sseClients.length} cliente(s):`, messageData);

    res.status(200).json({ 
      success: true, 
      message: 'Mensagem recebida e enviada para o frontend',
      clientsNotified: sseClients.length
    });

  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Endpoint de teste para verificar se o servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connectedClients: sseClients.length,
    port: PORT
  });
});

// Endpoint para testar o envio de mensagem (útil para testes)
app.post('/test-message', (req, res) => {
  const testMessage = {
    message: req.body.message || 'Mensagem de teste do servidor',
    from: 'Servidor',
    timestamp: new Date().toISOString()
  };

  sseClients.forEach(client => {
    try {
      client.response.write(`data: ${JSON.stringify(testMessage)}\n\n`);
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
    }
  });

  res.json({ 
    success: true, 
    message: 'Mensagem de teste enviada',
    data: testMessage 
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /events - Server-Sent Events para o frontend',
      'POST /webhook - Receber mensagens do n8n',
      'GET /health - Status do servidor',
      'POST /test-message - Enviar mensagem de teste'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor webhook rodando na porta ${PORT}`);
  console.log(`📡 Endpoint SSE: http://localhost:${PORT}/events`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Teste: http://localhost:${PORT}/test-message`);
  console.log('\n📋 Configuração do n8n:');
  console.log(`   URL do webhook: http://localhost:${PORT}/webhook`);
  console.log(`   Método: POST`);
  console.log(`   Body: { "message": "texto da resposta", "from": "Bot" }`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, fechando servidor...');
  sseClients.forEach(client => {
    client.response.end();
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Recebido SIGINT, fechando servidor...');
  sseClients.forEach(client => {
    client.response.end();
  });
  process.exit(0);
});

