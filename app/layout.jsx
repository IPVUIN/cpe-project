import { Prompt, Roboto } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
const fontItim = Prompt({
  variable: "--font-prompt",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const fontRoboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "700"],
});

// export const metadata = {
//   title: "Canteen-Order",
//   description: "My project class CPE491",
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fontItim.variable} ${fontRoboto.variable}`}>
      <body className={`antialiased `}>
        <CartProvider>
          <div>
            <Sidebar />

            <div className="marginsidebar">
              <div className="container pageFade">{children}</div>
            </div>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
