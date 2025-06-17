
# PulseOn - Plataforma de Treinos Personalizados
# Autor: André silva - Giulio
# Data: 17/06/2025

## 📋 Descrição

PulseOn é uma plataforma web moderna para criação e acompanhamento de treinos personalizados, utilizando inteligência artificial para gerar exercícios adaptados ao perfil do usuário. O sistema oferece uma experiência completa de fitness com autenticação, perfis detalhados e integração com IA.

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca para interface de usuário
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis
- **React Hook Form** - Gerenciamento de formulários
- **TanStack Query** - Gerenciamento de estado servidor
- **Framer Motion** - Animações
- **Wouter** - Roteamento
- **Lucide React** - Ícones

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **SQLite** com **Better-SQLite3** - Banco de dados
- **Drizzle ORM** - ORM para TypeScript
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Multer** - Upload de arquivos
- **Zod** - Validação de schemas

### Integrações
- **N8N** - Integração com IA para geração de treinos
- **PostgreSQL** - Suporte opcional para produção

## 📁 Estrutura do Projeto

```
pulseon/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Hooks customizados
│   │   └── lib/           # Utilitários
├── server/                # Backend Express
│   ├── migrations/        # Migrações do banco
│   ├── auth.ts           # Sistema de autenticação
│   ├── routes.ts         # Definição de rotas
│   ├── storage.ts        # Camada de persistência
│   └── n8n-service.ts    # Integração com IA
├── shared/               # Schemas compartilhados
└── uploads/              # Arquivos enviados pelos usuários
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 20+
- npm ou yarn

### Passos de Instalação

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd pulseon
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure variáveis de ambiente:**
```bash
# Crie um arquivo .env na raiz do projeto
JWT_SECRET=sua_chave_secreta_jwt
N8N_API_KEY=sua_chave_api_n8n
N8N_WEBHOOK_URL=url_do_webhook_n8n
```

4. **Inicialize o banco de dados:**
```bash
npm run db:push
```

5. **Execute o projeto:**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

## 📡 API Endpoints

### 🔐 Autenticação

#### POST `/api/auth/setup`
Criação completa de usuário com onboarding.

**Body:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "birthDate": "YYYY-MM-DD",
  "weight": "number",
  "height": "number",
  "gender": "male|female|other",
  "fitnessGoal": "lose_weight|gain_muscle|improve_conditioning",
  "experienceLevel": "beginner|intermediate|advanced",
  "weeklyFrequency": "number",
  "availableEquipment": ["string[]"],
  "physicalRestrictions": "string?"
}
```

#### POST `/api/auth/register`
Registro básico de usuário.

**Body:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string"
}
```

#### POST `/api/auth/login`
Login de usuário.

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

#### GET `/api/auth/me`
Obter dados do usuário logado.

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/auth/logout`
Logout do usuário.

### 👤 Usuários

#### GET `/api/users/:id`
Obter dados de usuário específico.

#### PATCH `/api/users/:id`
Atualizar dados do usuário.

#### POST `/api/profile/photo`
Upload de foto de perfil.

**Headers:** `Authorization: Bearer <token>`
**Body:** `multipart/form-data` com campo `photo`

### 🏋️ Treinos

#### GET `/api/workouts`
Listar treinos (com filtro opcional por usuário).

**Query Params:**
- `userId`: number (opcional)

#### GET `/api/workouts/:id`
Obter treino específico.

#### POST `/api/workouts`
Criar novo treino.

**Body:**
```json
{
  "userId": "number",
  "name": "string",
  "description": "string",
  "duration": "number",
  "difficulty": "beginner|intermediate|advanced",
  "exercises": "object[]"
}
```

### 📊 Sessões de Treino

#### GET `/api/workout-sessions`
Listar sessões de treino do usuário.

**Query Params:**
- `userId`: number (obrigatório)

#### POST `/api/workout-sessions`
Criar nova sessão de treino.

#### PUT `/api/workout-sessions/:id`
Atualizar sessão de treino.

### 🤖 Integração N8N

#### GET `/api/n8n/users`
Listar usuários (para integração externa).

**Headers:** `X-API-Key: <N8N_API_KEY>`

#### GET `/api/n8n/users/:id`
Obter usuário específico (para integração externa).

#### POST `/api/n8n/workout-sessions`
Criar sessão via integração externa.

#### GET `/api/n8n/workouts`
Listar treinos via integração externa.

### 🔄 Sistema

#### GET `/api/health`
Health check da aplicação.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🗄️ Banco de Dados

### Tabelas Principais

#### users
- `id` - Identificador único
- `email` - Email do usuário (único)
- `password` - Senha hash
- `name` - Nome completo
- `birthDate` - Data de nascimento
- `weight` - Peso (kg)
- `height` - Altura (cm)
- `gender` - Gênero
- `fitnessGoal` - Objetivo fitness
- `experienceLevel` - Nível de experiência
- `weeklyFrequency` - Frequência semanal
- `availableEquipment` - Equipamentos disponíveis (JSON)
- `physicalRestrictions` - Restrições físicas
- `onboardingCompleted` - Status do onboarding
- `avatarUrl` - URL do avatar

#### workouts
- `id` - Identificador único
- `userId` - Referência ao usuário
- `name` - Nome do treino
- `description` - Descrição
- `duration` - Duração em minutos
- `difficulty` - Nível de dificuldade
- `exercises` - Exercícios (JSON)

#### workout_sessions
- `id` - Identificador único
- `userId` - Referência ao usuário
- `workoutId` - Referência ao treino
- `completedAt` - Data de conclusão
- `duration` - Duração real
- `notes` - Observações

## 🔒 Segurança

### Autenticação
- **JWT Tokens** para autenticação stateless
- **bcryptjs** para hash de senhas
- **Middleware de autenticação** para rotas protegidas

### Validação
- **Zod schemas** para validação de entrada
- **Sanitização** de dados de usuário
- **Validação de tipos de arquivo** para uploads

### API Externa
- **API Key** para integração N8N
- **Headers personalizados** para autenticação externa

## 🚀 Deploy

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

### Variáveis de Ambiente Necessárias
```bash
NODE_ENV=production
JWT_SECRET=chave_secreta_forte
N8N_API_KEY=chave_api_n8n
N8N_WEBHOOK_URL=url_webhook_n8n
```

## 📈 Performance

### Otimizações Implementadas
- **Índices de banco** para consultas frequentes
- **Monitoramento de queries lentas** (>100ms)
- **Compressão de assets** via Vite
- **Lazy loading** de componentes React
- **Query caching** com TanStack Query

### Métricas de Performance
- **Time to First Byte**: < 200ms
- **First Contentful Paint**: < 1s
- **Largest Contentful Paint**: < 2.5s

## 🧪 Testes

### Estrutura de Testes
```bash
# Executar testes unitários
npm run test

# Executar testes com coverage
npm run test:coverage

# Executar testes E2E
npm run test:e2e
```

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Componentes Adaptativos
- **Navigation** com drawer em mobile
- **Cards** responsivos
- **Formulários** otimizados para touch

## 🔄 Integrações

### N8N AI Service
- **Geração automática** de treinos baseada no perfil
- **Webhook endpoints** para comunicação bidirecional
- **Fallback local** quando IA não disponível

### Upload de Arquivos
- **Multer** para processamento
- **Validação de tipos** (JPEG, PNG, GIF, WebP)
- **Limite de tamanho** (5MB)
- **Armazenamento local** com URLs públicas

## 🐛 Troubleshooting

### Problemas Comuns

#### Database locked
```bash
# Reiniciar o servidor
npm run dev
```

#### JWT Invalid
```bash
# Limpar localStorage no browser
localStorage.clear()
```

#### Port already in use
```bash
# Verificar processos na porta 5000
lsof -i :5000
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte e dúvidas:
- **Email**: suporte@pulseon.com
- **Issues**: [GitHub Issues](github-repo-url/issues)
- **Documentação**: [Wiki do Projeto](github-repo-url/wiki)

---

**Desenvolvido com ❤️ por [Seu Nome/Equipe]**
