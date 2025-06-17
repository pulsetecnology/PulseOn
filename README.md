
# PulseOn - Piattaforma di Allenamenti Personalizzati

**Autori:** André Silva - Giulio Vittorio  
**Data:** 17/06/2025

## 📋 Descrizione

PulseOn è una piattaforma web moderna per la creazione e il monitoraggio di allenamenti personalizzati, che utilizza l'intelligenza artificiale per generare esercizi adattati al profilo dell'utente. Il sistema offre un'esperienza fitness completa con autenticazione, profili dettagliati e integrazione AI tramite N8N.

## 🚀 Tecnologie Utilizzate

### Frontend
- **React 18** - Libreria per interfacce utente
- **TypeScript** - Tipizzazione statica
- **Vite** - Build tool e server di sviluppo
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Componenti accessibili
- **React Hook Form** - Gestione form
- **TanStack Query** - Gestione stato server
- **Framer Motion** - Animazioni
- **Wouter** - Routing
- **Lucide React** - Icone

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipizzazione statica
- **SQLite** con **Better-SQLite3** - Database
- **Drizzle ORM** - ORM per TypeScript
- **JWT** - Autenticazione
- **bcryptjs** - Hash password
- **Multer** - Upload file
- **Zod** - Validazione schemi

### Integrazioni
- **N8N** - Integrazione AI per generazione allenamenti
- **PostgreSQL** - Supporto opzionale per produzione

## 📁 Struttura del Progetto

```
pulseon/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Componenti riutilizzabili
│   │   │   ├── ui/           # Componenti UI base
│   │   │   ├── Layout.tsx    # Layout principale
│   │   │   ├── Header.tsx    # Header con navigazione
│   │   │   └── ...
│   │   ├── pages/            # Pagine applicazione
│   │   │   ├── Home.tsx      # Dashboard principale
│   │   │   ├── Profile.tsx   # Profilo utente
│   │   │   ├── Workout.tsx   # Allenamenti
│   │   │   └── ...
│   │   ├── hooks/            # Hook personalizzati
│   │   └── lib/              # Utilità
├── server/                   # Backend Express
│   ├── migrations/           # Migrazioni database
│   ├── auth.ts              # Sistema autenticazione
│   ├── routes.ts            # Definizione rotte
│   ├── storage.ts           # Layer persistenza
│   ├── middleware.ts        # Middleware Express
│   └── n8n-service.ts       # Integrazione AI
├── shared/                  # Schemi condivisi
│   └── schema.ts
└── uploads/                 # File caricati dagli utenti
```

## 🔧 Installazione e Configurazione

### Prerequisiti
- Node.js 20+
- npm

### Installazione

1. **Clona il repository:**
```bash
git clone <repository-url>
cd pulseon
```

2. **Installa le dipendenze:**
```bash
npm install
```

3. **Configura le variabili d'ambiente:**
```bash
# Crea un file .env nella root del progetto
JWT_SECRET=tua_chiave_segreta_jwt
N8N_API_KEY=tua_chiave_api_n8n
N8N_WEBHOOK_URL=url_webhook_n8n
```

4. **Inizializza il database:**
```bash
npm run db:push
```

5. **Avvia il progetto:**
```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5000`

## 📡 Endpoints API

### 🔐 Autenticazione

#### POST `/api/auth/setup`
Creazione completa utente con onboarding in un singolo passaggio.

**Body:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "birthDate": "YYYY-MM-DD",
  "age": "number",
  "weight": "number",
  "height": "number",
  "gender": "male|female|other|not_specified",
  "fitnessGoal": "lose_weight|gain_muscle|improve_conditioning",
  "experienceLevel": "beginner|intermediate|advanced",
  "weeklyFrequency": "number",
  "availableEquipment": ["string[]"],
  "physicalRestrictions": "string?"
}
```

#### POST `/api/auth/register`
Registrazione base utente.

#### POST `/api/auth/login`
Login utente.

#### GET `/api/auth/me`
Ottieni dati utente autenticato.

#### POST `/api/auth/logout`
Logout utente.

### 👤 Utenti

#### GET `/api/users/:id`
Ottieni dati utente specifico.

#### PATCH `/api/users/:id`
Aggiorna dati utente.

#### PATCH `/api/profile/update`
Aggiorna profilo utente con validazione estesa.

#### POST `/api/profile/photo`
Upload foto profilo.

#### POST `/api/profile/avatar`
Upload avatar utente.

### 🏋️ Allenamenti

#### GET `/api/workouts`
Lista allenamenti (con filtro opzionale per utente).

#### GET `/api/workouts/:id`
Ottieni allenamento specifico.

#### POST `/api/workouts`
Crea nuovo allenamento.

### 📊 Sessioni Allenamento

#### GET `/api/workout-sessions`
Lista sessioni allenamento utente.

#### POST `/api/workout-sessions`
Crea nuova sessione allenamento.

#### PUT `/api/workout-sessions/:id`
Aggiorna sessione allenamento.

### 🤖 Integrazione N8N

#### GET `/api/n8n/users`
Lista utenti (per integrazione esterna).

#### GET `/api/n8n/users/:id`
Ottieni utente specifico (per integrazione esterna).

#### POST `/api/n8n/workout-sessions`
Crea sessione via integrazione esterna.

#### GET `/api/n8n/workouts`
Lista allenamenti via integrazione esterna.

### 📁 Upload File

#### GET `/api/uploads/:filename`
Serve file caricati.

### 🔄 Sistema

#### GET `/api/health`
Health check applicazione.

## 🗄️ Database

### Tabelle Principali

#### users
- `id` - Identificatore unico
- `email` - Email utente (unico)
- `password` - Password hash
- `name` - Nome completo
- `birth_date` - Data di nascita
- `age` - Età
- `weight` - Peso (kg)
- `height` - Altezza (cm)
- `gender` - Genere
- `fitness_goal` - Obiettivo fitness
- `experience_level` - Livello esperienza
- `weekly_frequency` - Frequenza settimanale
- `available_equipment` - Attrezzature disponibili (JSON)
- `custom_equipment` - Attrezzature personalizzate
- `physical_restrictions` - Restrizioni fisiche
- `onboarding_completed` - Status onboarding
- `avatar_url` - URL avatar
- `smoking_status` - Status fumatore
- `sleep_quality` - Qualità sonno
- `stress_level` - Livello stress
- `preferred_workout_time` - Orario preferito allenamento
- `available_days_per_week` - Giorni disponibili per settimana
- `average_workout_duration` - Durata media allenamento
- `preferred_location` - Luogo preferito allenamento

#### workouts
- `id` - Identificatore unico
- `user_id` - Riferimento utente
- `name` - Nome allenamento
- `description` - Descrizione
- `duration` - Durata in minuti
- `difficulty` - Livello difficoltà
- `exercises` - Esercizi (JSON)
- `completed_at` - Data completamento
- `created_at` - Data creazione

#### workout_sessions
- `id` - Identificatore unico
- `user_id` - Riferimento utente
- `workout_id` - Riferimento allenamento
- `started_at` - Data inizio
- `completed_at` - Data completamento
- `exercises` - Esercizi eseguiti (JSON)
- `total_duration` - Durata totale

## 🔒 Sicurezza

### Autenticazione
- **JWT Tokens** per autenticazione stateless
- **bcryptjs** per hash password
- **Middleware autenticazione** per rotte protette

### Validazione
- **Schemi Zod** per validazione input
- **Sanitizzazione** dati utente
- **Validazione tipi file** per upload

### API Esterna
- **API Key** per integrazione N8N
- **Header personalizzati** per autenticazione esterna

## 🎨 Interfaccia Utente

### Caratteristiche UI
- **Design responsive** per mobile e desktop
- **Tema scuro** di default
- **Navigazione bottom** per mobile
- **Header con avatar** e notifiche
- **Toasts** per feedback utente
- **Modali** per azioni importanti

### Pagine Principali
- **Home** - Dashboard con statistiche e completamento profilo
- **Profile** - Gestione profilo utente completo
- **Workout** - Visualizzazione e gestione allenamenti
- **History** - Storico sessioni allenamento
- **Login/Register** - Autenticazione
- **Onboarding** - Setup iniziale utente

## 🚀 Deploy

### Sviluppo
```bash
npm run dev
```

### Produzione
```bash
npm run build
npm start
```

### Variabili Ambiente Necessarie
```bash
NODE_ENV=production
JWT_SECRET=chiave_segreta_forte
N8N_API_KEY=chiave_api_n8n
N8N_WEBHOOK_URL=url_webhook_n8n
```

## 📈 Performance

### Ottimizzazioni Implementate
- **Indici database** per query frequenti
- **Monitoraggio query lente** (>100ms)
- **Compressione asset** via Vite
- **Lazy loading** componenti React
- **Query caching** con TanStack Query
- **Error boundaries** per gestione errori

### Gestione Errori
- **Error boundary** React globale
- **Try-catch** nei componenti critici
- **Fallback UI** per stati di errore
- **Logging** errori server

## 🧪 Testing

### Script Disponibili
```bash
# Esegui in modalità sviluppo
npm run dev

# Build per produzione
npm run build

# Avvia server produzione
npm start

# Verifica TypeScript
npm run check

# Push schema database
npm run db:push
```

## 📱 Responsività

### Breakpoints
- **Mobile**: < 768px (navigazione bottom)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px (navigazione header)

### Componenti Adattivi
- **Navigation** con drawer in mobile
- **Cards** responsive
- **Form** ottimizzati per touch
- **Avatar** e profili scalabili

## 🔄 Integrazioni

### Servizio AI N8N
- **Generazione automatica** allenamenti basata su profilo
- **Endpoint webhook** per comunicazione bidirezionale
- **Fallback locale** quando AI non disponibile
- **Autenticazione API key** per sicurezza

### Upload File
- **Multer** per processamento
- **Validazione tipi** (JPEG, PNG, GIF, WebP)
- **Limite dimensione** (5MB)
- **Storage locale** con URL pubblici
- **Gestione avatar** e foto profilo

## 🔧 Configurazione Database

### SQLite (Sviluppo)
- **Database locale** `pulseon.db`
- **Migrazioni automatiche** all'avvio
- **Seeding utente test** per sviluppo

### PostgreSQL (Produzione)
- **Supporto opzionale** via Drizzle ORM
- **Configurazione via environment**

## 🐛 Troubleshooting

### Problemi Comuni

#### Database locked
```bash
# Riavvia il server
npm run dev
```

#### JWT Invalid
```bash
# Pulisci localStorage nel browser
localStorage.clear()
```

#### Porta già in uso
```bash
# Verifica processi sulla porta 5000
lsof -i :5000
# Termina processo se necessario
kill -9 <PID>
```

#### Errori di build
```bash
# Pulisci cache e reinstalla
rm -rf node_modules package-lock.json
npm install
```

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per maggiori dettagli.

## 👥 Contribuzione

1. Fork del progetto
2. Crea branch per la tua feature (`git checkout -b feature/NuovaFeature`)
3. Commit delle modifiche (`git commit -m 'Aggiungi NuovaFeature'`)
4. Push della branch (`git push origin feature/NuovaFeature`)
5. Apri una Pull Request

## 📞 Supporto

Per supporto e domande:
- **Email**: supporto@pulseon.com
- **Issues**: [GitHub Issues](github-repo-url/issues)
- **Documentazione**: [Wiki del Progetto](github-repo-url/wiki)

---

**Sviluppato con ❤️ da André Silva e Giulio Vittorio**
