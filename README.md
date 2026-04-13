# Forma — Evaluador de Terrenos

Evaluador rápido de oportunidades de terreno para uso interno. Acceso por invitación.

## Para quién es

Colaboradores y aliados que reciben información de terrenos y necesitan una evaluación estructurada rápida, sin ser expertos en originación inmobiliaria.

## Qué hace

1. Detecta la estrategia aplicable desde la ubicación
2. Aplica criterios eliminatorios (NO-GO automáticos)
3. Puntúa 8 categorías (0–100 cada una)
4. Genera puntaje final ponderado + recomendación en una oración
5. Permite guardar el historial de evaluaciones por usuario

Toda la rúbrica (benchmarks, criterios eliminatorios, descriptores de scorecard) vive en Supabase bajo RLS. Este repositorio contiene únicamente el shell de la aplicación y la lógica del intérprete. Sin una cuenta autenticada y la rúbrica cargada en la base de datos, la app no funciona.

## Stack

- Next.js 14 (App Router) + TypeScript strict + Tailwind
- Supabase (Postgres + Auth) con Row Level Security
- `@supabase/ssr` para sesiones server+client

## Setup local

1. Clonar e instalar:
   ```bash
   npm install
   ```
2. Copiar `.env.example` a `.env.local` y completar con las credenciales del proyecto Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_public_key>
   ```
3. En el SQL Editor de Supabase, ejecutar en orden:
   - `supabase/migrations/0001_init.sql` (esquema + RLS)
   - `supabase/seed.sql` (datos de rúbrica — archivo local, no versionado)
4. Crear usuarios desde Supabase Dashboard → Authentication → Users → Invite.
5. Iniciar el servidor:
   ```bash
   npm run dev
   ```
6. Abrir `http://localhost:3000` e ingresar con las credenciales invitadas.

## Estructura

```
src/
├── app/
│   ├── layout.tsx             # HTML shell
│   ├── login/                 # Email + password, sin sign-up público
│   └── (app)/                 # Rutas protegidas
│       ├── layout.tsx         # Header + RubricProvider
│       ├── page.tsx           # Evaluador
│       ├── weights/           # CRUD de pesos personales
│       └── assessments/       # Historial del usuario
├── components/
│   ├── AppHeader.tsx          # Nav + logout
│   ├── EvaluationForm.tsx     # Formulario mínimo
│   └── ResultsPanel.tsx       # Resultado + guardar
├── lib/
│   ├── supabase/              # Clientes browser/server/middleware
│   ├── rubric/                # Fetch y contexto de la rúbrica
│   ├── types.ts               # Tipos de dominio
│   ├── eliminatory.ts         # Predicados (lógica; umbrales en DB)
│   ├── scoring.ts             # Scorers (lógica; descriptores en DB)
│   └── weights.ts              # Helpers de user_weights
├── middleware.ts              # Gate de autenticación
supabase/
├── migrations/0001_init.sql   # Esquema + RLS
└── seed.sql                   # NO versionado — contenido confidencial
```

## Diseño

- **Separación datos/lógica:** los números, etiquetas y descriptores de la rúbrica viven en Supabase. El código es un intérprete puro: recibe la rúbrica como entrada y la interpreta. Esto permite publicar el código sin exponer la rúbrica.
- **RLS obligatorio:** ninguna tabla es legible sin autenticación. Las tablas de rúbrica son read-only para usuarios autenticados; `user_weights` y `assessments` son visibles solo para su dueño.
- **Invite-only:** no existe página de registro. Los administradores invitan usuarios desde el dashboard de Supabase.
- **Sin datos mockeados:** si la rúbrica no está cargada, la app muestra un error explícito en lugar de fabricar valores.

## Deploy

Cualquier host que soporte Next.js (Vercel recomendado). Configurar las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el proveedor.
