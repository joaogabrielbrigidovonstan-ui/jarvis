# Project Notes — Jarvis

## Como gerar o APK Android (Capacitor)

O app já está configurado com Capacitor (pasta `android/` gerada). Para compilar o `.apk`:

1. **Instale o Android Studio** (https://developer.android.com/studio) — ele traz o Android SDK e o JDK.
2. No terminal, dentro de `/workspace/jarvis`:
   - `npm install` (se ainda não instalou)
   - `npm run build` (gera `dist/`)
   - `npx cap sync android` (copia o build para o projeto nativo)
3. Abra o projeto no Android Studio: `npx cap open android`
4. No Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
   - O `.apk` aparece em `android/app/build/outputs/apk/debug/app-debug.apk`.
   - Alternativa por linha de comando: `cd android && ./gradlew assembleDebug`.

5. Transfira o `.apk` para o celular (cabo USB ou nuvem) e instale com
   **"instalar de fontes desconhecidas"** ativado.

## Observações

- O `appId` é `com.jarvis.app` (definido em `capacitor.config.ts`).
- O app precisa de microfone (para o "Hey Jarvis") e de permissão de Internet no Android.
- O "cérebro" (Claude Code) roda no `bridge` — no app nativo, o bridge precisa estar
  rodando em uma máquina acessível, ou o app funciona apenas na interface visual.
- A pasta `android/` é gerada pelo Capacitor; não edite à mão sem `npx cap sync`.

## Brain / backend

- `VITE_BACKEND` pode ser `bridge` (padrão, exige `npm run bridge`), `direct`
  (chave da API Anthropic) ou `gemini` (chave gratuita do Google Gemini, funciona
  sozinho no celular).
- Para um APK independente no celular, compile com `VITE_BACKEND=gemini` e
  `VITE_GEMINI_API_KEY` (grátis, sem cartão) — ver `src/lib/gemini.ts`.
- O input `gemini_key` do workflow (`workflow_dispatch`) injeta a chave no build.
