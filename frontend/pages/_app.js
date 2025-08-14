import "@/styles/globals.css";
import "@/styles/animations.css";
import { Provider } from 'react-redux';
import { store } from '../store';
import { useAuth } from '../hooks/useAuth';
import Layout from "../components/layout/Layout";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useRouter } from "next/router";
import Head from 'next/head';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LOGO_IMAGE } from '../utils/constants';
import { useState, useEffect } from 'react';

// Auth wrapper component that uses Redux
const AuthWrapper = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || loading || (isAuthenticated && !user)) {
    return <LoadingSpinner message="Loading..." fullScreen={true} />;
  }

  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  return children;
};

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const noLayoutRoutes = ["/auth/login", "/auth/register"];
  const isNoLayout = noLayoutRoutes.includes(router.pathname);

  return (
    <Provider store={store}>
      <Head>
        <link rel="icon" type="image/png" sizes="32x32" href={LOGO_IMAGE} />
      </Head>
      {isNoLayout ? (
        <Component {...pageProps} />
      ) : (
        <AuthWrapper>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </AuthWrapper>
      )}
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Provider>
  );
}
