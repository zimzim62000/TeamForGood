import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "COM Arcade — Le jeu de la semaine", description: "Le service satellite ludique de l'intranet." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="fr"><body>{children}</body></html>; }
