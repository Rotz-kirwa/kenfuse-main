import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
}

const Layout = ({ children, hideNav = false, hideFooter = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && <Navbar />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
      <a
        href="https://wa.me/254115715716"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Kenfuse on WhatsApp"
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full shadow-[0_10px_25px_rgba(37,211,102,0.45)] transition-transform hover:scale-105"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          className="h-14 w-14 rounded-full object-cover"
          loading="lazy"
        />
      </a>
    </div>
  );
};

export default Layout;
