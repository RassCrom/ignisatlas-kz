import HeadMeta from "./HeadMeta";
import Header from "src/shared/components/Header/Header";

const Layout = ({ children }) => {
  return (
    <>
      <HeadMeta />
      <Header />
      <main>
        {children}
      </main>
    </>
  );
};

export default Layout;