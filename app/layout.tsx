import * as React from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './provider'

export const metadata: Metadata = {
  title: 'Desglose de Torres - ISA Transelca',
  description: 'Sistema de búsqueda y cálculo de materiales para torres',
  icons: {
    icon: '/icon.svg', // o '/logo.png'
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png', // Opcional para iOS
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="relative min-h-screen w-full bg-[#003594]">
        <Providers>
        
        {/* --- CAPA DE FONDO (Imágenes Decorativas) --- */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          
          {/* 1. Mariposas Animadas - Múltiples instancias flotando por la pantalla */}
          {/* Mariposa 1 - Superior izquierda */}
          <div className="absolute top-10 left-0 w-24 md:w-32 lg:w-40 animate-float opacity-100">
            <img 
              src="/img/mariposas.png" 
              alt="Mariposas" 
              className="w-full h-auto object-contain"
              style={{ animationDelay: '0s', animationDuration: '8s' }}
            />
          </div>

          {/* Mariposa 2 - Superior derecha */}
          <div className="absolute top-20 right-10 w-20 md:w-28 lg:w-36 animate-float opacity-95">
            <img 
              src="/img/mariposas.png" 
              alt="Mariposas" 
              className="w-full h-auto object-contain transform scale-x-[-1]"
              style={{ animationDelay: '2s', animationDuration: '10s' }}
            />
          </div>

          {/* Mariposa 3 - Centro superior */}
          <div className="absolute top-32 left-1/4 w-16 md:w-24 lg:w-32 animate-float opacity-90">
            <img 
              src="/img/mariposas.png" 
              alt="Mariposas" 
              className="w-full h-auto object-contain"
              style={{ animationDelay: '4s', animationDuration: '12s' }}
            />
          </div>

          {/* Mariposa 4 - Medio izquierda */}
          <div className="absolute top-1/3 left-16 w-20 md:w-28 lg:w-36 animate-float opacity-100">
            <img 
              src="/img/mariposas.png" 
              alt="Mariposas" 
              className="w-full h-auto object-contain transform scale-x-[-1]"
              style={{ animationDelay: '1s', animationDuration: '9s' }}
            />
          </div>

          {/* Mariposa 5 - Medio derecha */}
          <div className="absolute top-1/2 right-20 w-18 md:w-26 lg:w-34 animate-float opacity-95">
            <img 
              src="/img/mariposas.png" 
              alt="Mariposas" 
              className="w-full h-auto object-contain"
              style={{ animationDelay: '3s', animationDuration: '11s' }}
            />
          </div>

          {/* Mariposa 6 - Centro */}
          <div className="absolute top-2/3 left-1/2 w-22 md:w-30 lg:w-38 animate-float opacity-100">
            <img 
              src="/img/mariposas.png" 
              alt="Mariposas" 
              className="w-full h-auto object-contain transform scale-x-[-1]"
              style={{ animationDelay: '5s', animationDuration: '7s' }}
            />
          </div>

          {/* Mariposa 7 - Inferior izquierda */}
          <div className="absolute bottom-1/4 left-32 w-24 md:w-32 lg:w-40 animate-float opacity-95">
            <img 
              src="/img/mariposas.png" 
              alt="Mariposas" 
              className="w-full h-auto object-contain"
              style={{ animationDelay: '6s', animationDuration: '9s' }}
            />
          </div>

          {/* Mariposa 8 - Inferior centro */}
          <div className="absolute bottom-32 left-2/3 w-20 md:w-28 lg:w-36 animate-float opacity-90">
            <img 
              src="/img/mariposas.png" 
              alt="Mariposas" 
              className="w-full h-auto object-contain transform scale-x-[-1]"
              style={{ animationDelay: '3.5s', animationDuration: '10.5s' }}
            />
          </div>

          {/* 2. Línea Naranja (Curva central) */}
          <div className="absolute top-1/4 left-0 w-full opacity-80">
             <img 
              src="/img/linea-naranja.png" 
              alt="Linea Decorativa" 
              className="w-full h-auto object-cover min-h-[200px]"
            />
          </div>

          {/* 3. Jaguar (Esquina inferior derecha) */}
          <div className="absolute bottom-0 right-0 z-0">
             <img 
              src="/img/jaguar.png" 
              alt="Jaguar" 
              className="w-64 md:w-96 lg:w-[450px] h-auto object-contain translate-y-4" 
            />
          </div>

          {/* 4. Logo ISA Transelca (Esquina inferior izquierda) */}
          <div className="absolute bottom-6 left-6 z-10">
             <img 
              src="/img/logo-isa.png" 
              alt="ISA Transelca" 
              className="w-32 md:w-48 lg:w-60 h-auto object-contain"
            />
          </div>
        </div>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <main className="relative z-10 min-h-screen flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}