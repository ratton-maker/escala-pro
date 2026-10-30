// --- CONFIGURAÇÃO DO FIREBASE ---
// IMPORTANTE: Antes de publicar, tens de colocar aqui os teus dados reais!

// 1. Vai a https://console.firebase.google.com/
// 2. Cria um novo projeto (ex: "EscalaEmpresa")
// 3. Nas definições do projeto, clica no ícone `</>` (Web App) para adicionar uma app.
// 4. Copia o objeto `firebaseConfig` que eles te mostram e substitui o código abaixo.

// Exemplo de como deve ficar (com os teus códigos reais):
/*
export const firebaseConfig = {
  apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "escala-empresa.firebaseapp.com",
  projectId: "escala-empresa",
  storageBucket: "escala-empresa.appspot.com",
  messagingSenderId: "8234723894",
  appId: "1:8234723894:web:234234234"
};
*/

// MANTÉM ESTE NOME (firebaseConfig)
export const firebaseConfig = {
  apiKey: "AIzaSyASXzDQFOMEOSEgjHEl396TzA19tlI8Pvc",
  authDomain: "escalapro-et.firebaseapp.com",
  projectId: "escalapro-et",
  storageBucket: "escalapro-et.firebasestorage.app",
  messagingSenderId: "149922994765",
  appId: "1:149922994765:web:838e85b01e3a64b51a1a04"
};

// --- REGRAS DO FIRESTORE ---
// No Firebase Console -> Build -> Firestore Database -> Rules
// Altera as regras para:
// allow read, write: if true;

// --- DOMÍNIOS AUTORIZADOS ---
// IMPORTANTE: Se mudares para o GitHub Pages, tens de ir a:
// Firebase Console -> Authentication -> Settings -> Authorized Domains
// E adicionar o teu novo domínio: "o-teu-usuario.github.io"