export const metadata = {
  title: "Emma Grad Party Games",
  description: "Graduation party games for Emma"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}