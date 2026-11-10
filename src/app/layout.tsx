import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "MakeCourse — Turn Any YouTube Video into a Structured Masterclass",
  description: "AI-powered learning platform that converts long YouTube playlists & videos into bite-sized daily lessons, synchronized study notes, placement tests, and quizzes with 'Replay the Moment' video seeking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50/50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

