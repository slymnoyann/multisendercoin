import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Multiple Sender | Send Tokens to Many on Base",
  description:
    "Send any ERC20 token to multiple recipients in one transaction on Base network.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
