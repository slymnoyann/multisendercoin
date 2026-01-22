import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "MultiSender | Send Tokens to Many on Base",
  description:
    "Send any ERC20 token or native ETH to multiple recipients in one transaction on Base network.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
