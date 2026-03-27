/// <reference types="vite/client" />

// Vite sudah bisa mengimpor image, tapi TypeScript perlu deklarasi tipe agar `tsc` tidak error.
declare module '*.png' {
  const src: string;
  export default src;
}

