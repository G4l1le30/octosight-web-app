import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem-4rem)]">
        {children}
      </main>
      <Footer />
    </>
  );
}
