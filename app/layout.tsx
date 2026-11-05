import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:"Free Wendy's",description:'Choose your reward stone, unlock a code, and redeem in the Wendy’s app. Five tasty picks, subject to availability.',icons:{icon:'/game/fries-stone.png'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
