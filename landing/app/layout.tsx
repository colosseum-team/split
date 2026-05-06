import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Split — Trustless freelance contracts on Solana",
  description:
    "Non-custodial escrow for clients and freelancers. Lock funds in a Solana smart contract, release them on delivery, pay fractions of a cent in fees.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
