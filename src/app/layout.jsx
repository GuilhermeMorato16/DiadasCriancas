import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "@/components/ui/provider"
import { Toaster } from "@/components/ui/toaster"; // Adicione esta linha

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Dia das Crianças Simetria",
  description: "Faça seu cadastro e ganhe mais uma chance de participar do nosso desafio do dia das crianças!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Provider>
          {children}
          <Toaster /> {/* Adicione esta linha */}
        </Provider>
              

      </body>
    </html>
  );
}
