// Override parent layout to remove ClientLayout (NavBar + Footer)
export default function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Return children directly without ClientLayout wrapper
  return <>{children}</>;
}
