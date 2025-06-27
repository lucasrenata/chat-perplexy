import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Send, Settings, MessageCircle, Webhook, ArrowRight, ArrowLeft } from 'lucide-react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [webhookConfig, setWebhookConfig] = useState({
    sendWebhook: 'https://seu-n8n.com/webhook/envio-mensagem',
    receivePort: '3001'
  })
  const [connectionStatus, setConnectionStatus] = useState({
    send: 'disconnected',
    receive: 'disconnected'
  })
  
  const messagesEndRef = useRef(null)

  // Auto scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Conectar ao servidor local para receber mensagens
  useEffect(() => {
    const connectToReceiveServer = () => {
      const eventSource = new EventSource(`http://localhost:${webhookConfig.receivePort}/events`)
      
      eventSource.onopen = () => {
        setConnectionStatus(prev => ({ ...prev, receive: 'connected' }))
        console.log('Conectado ao servidor de recebimento')
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.message) {
            const receivedMessage = {
              id: Date.now() + Math.random(),
              text: data.message,
              type: 'received',
              timestamp: new Date().toLocaleTimeString(),
              from: data.from || 'Bot'
            }
            setMessages(prev => [...prev, receivedMessage])
          }
        } catch (error) {
          console.error('Erro ao processar mensagem recebida:', error)
        }
      }

      eventSource.onerror = () => {
        setConnectionStatus(prev => ({ ...prev, receive: 'error' }))
        console.log('Erro na conexão com servidor de recebimento')
      }

      return eventSource
    }

    let eventSource
    if (webhookConfig.receivePort) {
      eventSource = connectToReceiveServer()
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [webhookConfig.receivePort])

  // Função para enviar mensagem via webhook para n8n
  const sendMessage = async () => {
    if (!inputMessage.trim() || !webhookConfig.sendWebhook) return

    const messageText = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Adiciona mensagem do usuário
    const userMessage = {
      id: Date.now(),
      text: messageText,
      type: 'sent',
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch(webhookConfig.sendWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          timestamp: new Date().toISOString(),
          userId: 'user-001',
          sessionId: 'session-' + Date.now()
        }),
      })

      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, send: 'connected' }))
        console.log('Mensagem enviada com sucesso para n8n')
      } else {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setConnectionStatus(prev => ({ ...prev, send: 'error' }))
      
      // Adiciona mensagem de erro
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Erro ao enviar mensagem. Verifique a configuração do webhook de envio.',
        type: 'error',
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Conectado'
      case 'error': return 'Erro'
      default: return 'Desconectado'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Chatbot Interface</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Button>
        </div>

        {/* Fluxo dos Webhooks */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Fluxo de Comunicação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <span className="font-medium">Frontend</span>
              </div>
              
              <div className="flex items-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
                <span className="mx-2 text-xs text-gray-500">Webhook 1</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <Webhook className="w-8 h-8 text-purple-600" />
                </div>
                <span className="font-medium">n8n</span>
              </div>
              
              <div className="flex items-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
                <span className="mx-2 text-xs text-gray-500">API</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <span className="font-medium">Evolution</span>
              </div>
              
              <div className="flex items-center">
                <ArrowLeft className="w-6 h-6 text-gray-400" />
                <span className="mx-2 text-xs text-gray-500">Webhook 2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status dos Webhooks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Webhook Envio</span>
                </div>
                <Badge className={`${getStatusColor(connectionStatus.send)} text-white`}>
                  {getStatusText(connectionStatus.send)}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">Frontend → n8n</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Webhook Recebimento</span>
                </div>
                <Badge className={`${getStatusColor(connectionStatus.receive)} text-white`}>
                  {getStatusText(connectionStatus.receive)}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">n8n → Frontend</p>
            </CardContent>
          </Card>
        </div>

        {/* Configurações dos Webhooks */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Configuração dos Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  🔄 Webhook 1: Envio de Mensagens (Frontend → n8n)
                </label>
                <Input
                  placeholder="https://seu-n8n.com/webhook/envio-mensagem"
                  value={webhookConfig.sendWebhook}
                  onChange={(e) => setWebhookConfig(prev => ({ 
                    ...prev, 
                    sendWebhook: e.target.value 
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL do n8n que receberá as mensagens do usuário
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  🔄 Webhook 2: Porta do Servidor Local (n8n → Frontend)
                </label>
                <Input
                  placeholder="3001"
                  value={webhookConfig.receivePort}
                  onChange={(e) => setWebhookConfig(prev => ({ 
                    ...prev, 
                    receivePort: e.target.value 
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porta onde o servidor local receberá as respostas do n8n
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Container */}
        <Card className="h-96">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Area */}
            <div className="h-80 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Configure os webhooks e inicie o servidor local!</p>
                  <p className="text-xs mt-2">Execute: <code>node server.js</code></p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'sent'
                          ? 'bg-blue-600 text-white'
                          : message.type === 'error'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs opacity-70">{message.timestamp}</p>
                        {message.from && (
                          <p className="text-xs opacity-70">{message.from}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || !webhookConfig.sendWebhook}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim() || !webhookConfig.sendWebhook}
                  className="px-4"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções Detalhadas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Instruções de Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🔄 Webhook 1: Envio (Frontend → n8n)</h4>
              <p className="mb-2">Configure um webhook no n8n que:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Receba requisições POST do frontend</li>
                <li>Processe a mensagem e envie para Evolution API</li>
                <li>Formato esperado: <code>{"{ message: 'texto', userId: 'user-001', sessionId: 'session-123' }"}</code></li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">🔄 Webhook 2: Recebimento (n8n → Frontend)</h4>
              <p className="mb-2">Configure um webhook no n8n que:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Receba a resposta da Evolution API</li>
                <li>Envie POST para: <code>http://localhost:{webhookConfig.receivePort}/webhook</code></li>
                <li>Formato: <code>{"{ message: 'resposta', from: 'Bot' }"}</code></li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚙️ Servidor Local</h4>
              <p className="mb-2">Execute o servidor local incluído no projeto:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>cd chat-frontend-react</code></li>
                <li><code>node server.js</code></li>
                <li>O servidor ficará disponível na porta configurada (padrão: 3001)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App

